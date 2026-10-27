// ==============================================================================
// SPP Billing & Additional Bills Campaign Service Engine
// Work Package: APP-MAHAD-FINANCE-BILLING-001 (Modul A & Modul C)
// Compliance: Idempotency, Anti-Duplication, Tenant-Isolation, Audit Trail
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import {
  sppBills,
  sppConfigurations,
  billingCampaigns,
} from '@/lib/db/schema/finance';
import { santri } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { financialAuditService } from './auditTrail';

export interface SaveSppConfigInput {
  tenantId: string;
  name: string;
  amount: number;
  billingDay?: number;
  dueDay?: number;
  academicYear?: string;
  effectiveFrom: string | Date;
  effectiveTo?: string | Date | null;
  actorId: string;
  actorName: string;
}

export interface GenerateMonthlySppInput {
  tenantId: string;
  periodMonthYear: string; // e.g. "Agustus 2026"
  triggeredBy: string;
  triggeredByName: string;
  forceDueDate?: string | Date;
}

export interface CreateAdditionalBillInput {
  tenantId: string;
  title: string;
  category: 'UJIAN' | 'KEGIATAN' | 'SERAGAM' | 'DAFTAR_ULANG' | 'LAINNYA';
  description?: string;
  academicYear?: string;
  amountPerStudent: number;
  dueDate: string | Date;
  targetType: 'ALL_ACTIVE' | 'KELAS' | 'CUSTOM_SANTRI';
  targetClasses?: string[];
  targetSantriIds?: string[];
  allowInstallments?: boolean;
  publishedBy: string;
  publishedByName: string;
}

export interface IssueExplicitSppBillInput {
  tenantId: string;
  santriId: string;
  periodMonthYear: string;
  amount: number;
  dueDate: string | Date;
  reason: string;
  allowInstallments?: boolean;
  actorId: string;
  actorName: string;
}

export class SppBillingService {
  /**
   * Retrieves the active SPP configuration for a tenant.
   */
  async getSppConfiguration(tenantId: string) {
    const configs = await db
      .select()
      .from(sppConfigurations)
      .where(
        and(
          eq(sppConfigurations.tenantId, tenantId),
          eq(sppConfigurations.status, 'ACTIVE')
        )
      )
      .orderBy(desc(sppConfigurations.createdAt))
      .limit(1);

    return configs[0] || null;
  }

  /**
   * Saves or updates SPP configuration.
   * Ensures historical billing preservation by versioning effective dates.
   */
  async saveSppConfiguration(input: SaveSppConfigInput) {
    const {
      tenantId,
      name,
      amount,
      billingDay = 1,
      dueDay = 10,
      academicYear,
      effectiveFrom,
      effectiveTo,
      actorId,
      actorName,
    } = input;

    if (!amount || amount <= 0) {
      throw new Error('INVALID_AMOUNT: Tarif SPP harus berupa integer lebih dari 0');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // Deactivate older active configs
      await tx
        .update(sppConfigurations)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(
          and(
            eq(sppConfigurations.tenantId, tenantId),
            eq(sppConfigurations.status, 'ACTIVE')
          )
        );

      const configId = `spp_cfg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const effectiveFromDate = new Date(effectiveFrom);
      const effectiveToDate = effectiveTo ? new Date(effectiveTo) : null;

      await tx.insert(sppConfigurations).values({
        id: configId,
        tenantId,
        name,
        amount,
        billingDay,
        dueDay,
        academicYear: academicYear || '2026/2027',
        targetScope: 'ALL_ACTIVE',
        effectiveFrom: effectiveFromDate,
        effectiveTo: effectiveToDate,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Audit Log
      await financialAuditService.log(
        {
          tenantId,
          correlationId: configId,
          actorId,
          actorName,
          actorRole: 'admin_keuangan',
          action: 'SPP_CONFIG_CREATED',
          targetEntity: 'spp_configuration',
          targetId: configId,
          amount,
          stateAfter: { name, amount, billingDay, dueDay, academicYear },
          status: 'SUCCESS',
          metadata: { name, amount, effectiveFrom },
        },
        tx
      );

      return {
        success: true,
        message: 'Konfigurasi tarif SPP berhasil disimpan dan diaktifkan',
        configId,
      };
    });
  }

  /**
   * Batch generates monthly SPP bills for all active santri.
   * IDEMPOTENT: Never creates duplicates for the same student and period.
   * HISTORICAL: Past unpaid bills remain untouched in their original period.
   */
  async generateMonthlySppBills(input: GenerateMonthlySppInput) {
    const {
      tenantId,
      periodMonthYear,
      triggeredBy,
      triggeredByName,
      forceDueDate,
    } = input;

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Get active configuration
      const configRows = await tx
        .select()
        .from(sppConfigurations)
        .where(
          and(
            eq(sppConfigurations.tenantId, tenantId),
            eq(sppConfigurations.status, 'ACTIVE')
          )
        )
        .orderBy(desc(sppConfigurations.createdAt))
        .limit(1);

      const activeConfig = configRows[0];
      const sppAmount = activeConfig ? activeConfig.amount : 1000000;
      const dueDay = activeConfig ? activeConfig.dueDay : 10;

      // Calculate default dueDate (e.g. 10th of the current/target month)
      let calculatedDueDate: Date;
      if (forceDueDate) {
        calculatedDueDate = new Date(forceDueDate);
      } else {
        calculatedDueDate = new Date();
        calculatedDueDate.setDate(dueDay);
        // If current date is past dueDay, set to next month or keep as 10th
        if (calculatedDueDate < new Date()) {
          calculatedDueDate.setMonth(calculatedDueDate.getMonth() + 1);
        }
      }

      // 2. Query target ACTIVE santri only (Excludes cuti, skors, lulus)
      const activeSantri = await tx
        .select()
        .from(santri)
        .where(
          and(
            eq(santri.tenantId, tenantId),
            eq(santri.status, 'Aktif')
          )
        );

      if (activeSantri.length === 0) {
        return {
          success: true,
          message: 'Tidak ada santri aktif yang ditemukan untuk ditagih pada tenant ini',
          generatedCount: 0,
          skippedCount: 0,
          totalTarget: 0,
        };
      }

      // 3. Query existing bills for this period to prevent duplication
      const existingBills = await tx
        .select({
          santriId: sppBills.santriId,
        })
        .from(sppBills)
        .where(
          and(
            eq(sppBills.tenantId, tenantId),
            eq(sppBills.periodMonthYear, periodMonthYear),
            eq(sppBills.category, 'SPP')
          )
        );

      const existingSantriIds = new Set(existingBills.map((b) => b.santriId));

      let generatedCount = 0;
      let skippedCount = 0;

      const periodSlug = periodMonthYear.replace(/\s+/g, '-').toUpperCase();

      for (const s of activeSantri) {
        if (existingSantriIds.has(s.id)) {
          skippedCount++;
          continue;
        }

        const billId = `bill_spp_${Date.now()}_${s.id.substring(0, 8)}_${crypto.randomBytes(2).toString('hex')}`;
        const billNumber = `SPP-${periodSlug}-${s.nis}`;

        await tx.insert(sppBills).values({
          id: billId,
          tenantId,
          santriId: s.id,
          santriName: s.name,
          waliId: s.waliId || 'wali_default',
          billNumber,
          periodMonthYear,
          title: `SPP Bulan ${periodMonthYear}`,
          category: 'SPP',
          billType: 'SPP_BULANAN',
          totalAmount: sppAmount,
          paidAmount: 0,
          remainingAmount: sppAmount,
          dueDate: calculatedDueDate,
          allowInstallments: true,
          status: 'UNPAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        generatedCount++;
      }

      // 4. Log Immutable Audit Trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: `gen_${periodSlug}_${Date.now()}`,
          actorId: triggeredBy,
          actorName: triggeredByName,
          actorRole: 'admin_keuangan',
          action: 'BATCH_BILLING_GENERATED',
          targetEntity: 'spp_bill',
          targetId: `batch_${periodSlug}`,
          amount: generatedCount * sppAmount,
          stateAfter: {
            periodMonthYear,
            generatedCount,
            skippedCount,
            sppAmount,
          },
          status: 'SUCCESS',
          metadata: { periodMonthYear, generatedCount, skippedCount },
        },
        tx
      );

      return {
        success: true,
        message: `Pembuatan tagihan SPP ${periodMonthYear} selesai: ${generatedCount} diterbitkan, ${skippedCount} dilewati (sudah ada).`,
        generatedCount,
        skippedCount,
        totalTarget: activeSantri.length,
      };
    });
  }

  /**
   * Publishes Additional (Non-SPP) Bill Campaign.
   * Target: ALL_ACTIVE, by KELAS, or CUSTOM_SANTRI.
   * Automatically generates corresponding spp_bills for each target student.
   */
  async createAdditionalBillCampaign(input: CreateAdditionalBillInput) {
    const {
      tenantId,
      title,
      category,
      description,
      academicYear = '2026/2027',
      amountPerStudent,
      dueDate,
      targetType,
      targetClasses = [],
      targetSantriIds = [],
      allowInstallments = false,
      publishedBy,
      publishedByName,
    } = input;

    if (!title || !title.trim()) {
      throw new Error('INVALID_TITLE: Nama tagihan tambahan wajib diisi');
    }

    if (!amountPerStudent || amountPerStudent <= 0) {
      throw new Error('INVALID_AMOUNT: Nominal per santri harus lebih dari 0');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Resolve Target Santri
      let targetSantriList: Array<typeof santri.$inferSelect> = [];

      if (targetType === 'ALL_ACTIVE') {
        targetSantriList = await tx
          .select()
          .from(santri)
          .where(
            and(
              eq(santri.tenantId, tenantId),
              eq(santri.status, 'Aktif')
            )
          );
      } else if (targetType === 'KELAS' && targetClasses.length > 0) {
        targetSantriList = await tx
          .select()
          .from(santri)
          .where(
            and(
              eq(santri.tenantId, tenantId),
              eq(santri.status, 'Aktif'),
              inArray(santri.kelas, targetClasses)
            )
          );
      } else if (targetType === 'CUSTOM_SANTRI' && targetSantriIds.length > 0) {
        targetSantriList = await tx
          .select()
          .from(santri)
          .where(
            and(
              eq(santri.tenantId, tenantId),
              eq(santri.status, 'Aktif'),
              inArray(santri.id, targetSantriIds)
            )
          );
      }

      if (targetSantriList.length === 0) {
        throw new Error('NO_TARGET_STUDENTS: Tidak ada santri aktif yang cocok dengan sasaran penerbitan');
      }

      const campaignId = `camp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const totalAmount = targetSantriList.length * amountPerStudent;
      const targetFilterStr =
        targetType === 'KELAS'
          ? JSON.stringify(targetClasses)
          : targetType === 'CUSTOM_SANTRI'
          ? JSON.stringify(targetSantriIds)
          : 'ALL_ACTIVE';

      const dueDateObj = new Date(dueDate);

      // 2. Insert Campaign Record
      await tx.insert(billingCampaigns).values({
        id: campaignId,
        tenantId,
        title,
        category,
        description: description || null,
        academicYear,
        amountPerStudent,
        publishDate: new Date(),
        dueDate: dueDateObj,
        targetType,
        targetFilter: targetFilterStr,
        allowInstallments,
        totalTargetSantri: targetSantriList.length,
        totalAmount,
        status: 'PUBLISHED',
        publishedBy,
        publishedByName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Batch Insert Individual Bills into spp_bills
      for (const s of targetSantriList) {
        const billId = `bill_add_${Date.now()}_${s.id.substring(0, 6)}_${crypto.randomBytes(2).toString('hex')}`;
        const billNumber = `ADD-${category}-${Date.now().toString().slice(-6)}-${s.nis}`;

        await tx.insert(sppBills).values({
          id: billId,
          tenantId,
          santriId: s.id,
          santriName: s.name,
          waliId: s.waliId || 'wali_default',
          billNumber,
          title,
          campaignId,
          category,
          billType: 'TAGIHAN_TAMBAHAN',
          periodMonthYear: academicYear,
          totalAmount: amountPerStudent,
          paidAmount: 0,
          remainingAmount: amountPerStudent,
          dueDate: dueDateObj,
          allowInstallments,
          status: 'UNPAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 4. Append Audit Trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: campaignId,
          actorId: publishedBy,
          actorName: publishedByName,
          actorRole: 'admin_keuangan',
          action: 'ADDITIONAL_BILL_PUBLISHED',
          targetEntity: 'billing_campaign',
          targetId: campaignId,
          amount: totalAmount,
          stateAfter: {
            title,
            category,
            totalTargetSantri: targetSantriList.length,
            amountPerStudent,
            totalAmount,
          },
          status: 'SUCCESS',
          metadata: { title, targetType, targetCount: targetSantriList.length },
        },
        tx
      );

      return {
        success: true,
        message: `Tagihan tambahan "${title}" berhasil diterbitkan untuk ${targetSantriList.length} santri.`,
        campaign: {
          id: campaignId,
          title,
          totalTargetSantri: targetSantriList.length,
          totalAmount,
        },
      };
    });
  }

  /**
   * Admin Keuangan issues an explicit SPP bill for a non-active (Cuti/Skors/etc.) student.
   * COMPLIANCE PO DECISION B:
   * - Never automatic.
   * - Requires explicit action, valid reason, and immutable audit logging.
   * - Does not wipe, forgive, or alter historical bills.
   */
  async issueExplicitSppBillForNonActiveSantri(input: IssueExplicitSppBillInput) {
    const {
      tenantId,
      santriId,
      periodMonthYear,
      amount,
      dueDate,
      reason,
      allowInstallments = true,
      actorId,
      actorName,
    } = input;

    if (!reason || reason.trim().length < 5) {
      throw new Error('INVALID_REASON: Alasan penagihan khusus santri nonaktif wajib diisi minimal 5 karakter');
    }

    if (!amount || amount <= 0) {
      throw new Error('INVALID_AMOUNT: Nominal tagihan harus lebih dari 0');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Fetch santri
      const santriRows = await tx
        .select()
        .from(santri)
        .where(
          and(
            eq(santri.tenantId, tenantId),
            eq(santri.id, santriId)
          )
        );

      const targetStudent = santriRows[0];
      if (!targetStudent) {
        throw new Error('SANTRI_NOT_FOUND: Data santri tidak ditemukan pada tenant ini');
      }

      // 2. Prevent duplicate SPP bill for the same period
      const existingBills = await tx
        .select()
        .from(sppBills)
        .where(
          and(
            eq(sppBills.tenantId, tenantId),
            eq(sppBills.santriId, santriId),
            eq(sppBills.periodMonthYear, periodMonthYear),
            eq(sppBills.category, 'SPP')
          )
        );

      if (existingBills.length > 0) {
        throw new Error(`DUPLICATE_BILL: Santri ini sudah memiliki tagihan SPP untuk periode ${periodMonthYear}`);
      }

      const periodSlug = periodMonthYear.replace(/\s+/g, '-').toUpperCase();
      const billId = `bill_spp_exp_${Date.now()}_${targetStudent.id.substring(0, 8)}_${crypto.randomBytes(2).toString('hex')}`;
      const billNumber = `SPP-KHUSUS-${periodSlug}-${targetStudent.nis || Date.now().toString().slice(-4)}`;
      const dueDateObj = new Date(dueDate);

      await tx.insert(sppBills).values({
        id: billId,
        tenantId,
        santriId: targetStudent.id,
        santriName: targetStudent.name,
        waliId: targetStudent.waliId || 'wali_default',
        billNumber,
        periodMonthYear,
        title: `SPP Bulan ${periodMonthYear} (Penagihan Khusus)`,
        category: 'SPP',
        billType: 'SPP_BULANAN',
        totalAmount: amount,
        paidAmount: 0,
        remainingAmount: amount,
        dueDate: dueDateObj,
        allowInstallments,
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Log Immutable Audit Trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: billId,
          actorId,
          actorName,
          actorRole: 'admin_keuangan',
          action: 'BATCH_BILLING_GENERATED',
          targetEntity: 'spp_bill',
          targetId: billId,
          amount,
          stateAfter: {
            santriId,
            santriStatus: targetStudent.status,
            periodMonthYear,
            amount,
            reason,
          },
          status: 'SUCCESS',
          metadata: {
            isExplicitNonActiveBilling: true,
            santriStatus: targetStudent.status,
            reason,
          },
        },
        tx
      );

      return {
        success: true,
        message: `Tagihan SPP khusus berhasil diterbitkan untuk santri ${targetStudent.name} (${targetStudent.status})`,
        billId,
        billNumber,
      };
    });
  }

  /**
   * Retrieves all billing campaigns for tenant.
   */
  async getBillingCampaigns(tenantId: string) {
    return await db
      .select()
      .from(billingCampaigns)
      .where(eq(billingCampaigns.tenantId, tenantId))
      .orderBy(desc(billingCampaigns.createdAt));
  }
}

export const sppBillingService = new SppBillingService();
