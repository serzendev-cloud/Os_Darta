// ========================================
// RFID Canteen POS Payment API Endpoint (Multi-Canteen & Catalog Supported)
// Hardened with Persistent DB-Backed Idempotency, Row Locking,
// Atomic Multi-Table Transaction, Server-side Pricing, & Persistent PIN Lock
// Work Package: WP-SEC-CANTEEN-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Tenant Scoping (400), Canonical RBAC (403)
// ========================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import {
  rfidCards,
  wallets,
  canteenTransactions,
  canteenTransactionItems,
  walletPockets,
  santri,
  canteens,
  canteenItems,
} from '@/lib/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { verifyPinCredential, isValidHex32, isValidHex64 } from '@/lib/security/pinCrypto';
import { merchantLedgerService } from '@/lib/finance/merchantLedger';
import { financialAuditService } from '@/lib/finance/auditTrail';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

export async function POST(request: Request) {
  try {
    // ── 0. Fail-Closed Server-Side Authentication & Tenant Resolution ────────────────
    let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
      }
    } catch {
      user = null;
    }

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    let tenant: { id: string };
    try {
      const tenantCtx = await getTenantContext();
      if (!tenantCtx?.id || tenantCtx.id.trim() === '' || tenantCtx.id === DEFAULT_TENANT.id) {
        return NextResponse.json(
          { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
        { status: 400 }
      );
    }

    // Canonical Permission Check
    const authz = await requirePermission(user.id, tenant.id, Permission.PROCESS_CANTEEN_PAYMENT);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk memproses transaksi pembayaran kantin',
        },
        { status: 403 }
      );
    }

    // Kasir diidentifikasi dari sesi server
    const posCashierId = user.id;
    const posCashierName =
      (user.user_metadata?.full_name as string) || user.email || `Kasir ${user.id}`;

    // ── 1. Input Parsing & Validation ──────────────────────────────────────────────
    const headerIdempotencyKey =
      request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const cardUid = typeof body.cardUid === 'string' ? body.cardUid : undefined;
    const pin = typeof body.pin === 'string' ? body.pin : undefined;
    const amount = typeof body.amount === 'number' ? body.amount : undefined;
    const canteenId = typeof body.canteenId === 'string' ? body.canteenId : undefined;
    const customVendorName = typeof body.vendorName === 'string' ? body.vendorName : 'Kantin Utama';
    const itemsDescription = typeof body.itemsDescription === 'string' ? body.itemsDescription : undefined;
    const items = Array.isArray(body.items) ? (body.items as Array<Record<string, unknown>>) : undefined;
    const bodyIdempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    const resolvedIdempotencyKey = headerIdempotencyKey || bodyIdempotencyKey;

    if (!cardUid || !pin || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Card UID, PIN, dan Nominal Belanja wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, code: 'INVALID_AMOUNT', message: 'Nominal transaksi harus berupa integer rupiah lebih dari 0' },
        { status: 400 }
      );
    }

    // ── 2. Database-Backed Idempotency & Anti-Replay Guard ─────────────────────────
    let canonicalRequestHash = '';
    if (resolvedIdempotencyKey) {
      const canonicalItems = Array.isArray(items)
        ? [...items]
            .map((item) => ({
              itemId: String(item.itemId || ''),
              qty: Number(item.qty) || 1,
              discount: Number(item.discount) || 0,
            }))
            .sort((a, b) => a.itemId.localeCompare(b.itemId))
        : [];

      const canonicalObject = {
        tenantId: tenant.id,
        canteenId: canteenId || null,
        cardUid,
        amount,
        items: canonicalItems,
      };

      canonicalRequestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(canonicalObject))
        .digest('hex');

      const existingRecord = await withTenantTransaction(tenant.id, async (tx) => {
        const existingTxList = await tx
          .select()
          .from(canteenTransactions)
          .where(
            and(
              eq(canteenTransactions.tenantId, tenant.id),
              eq(canteenTransactions.idempotencyKey, resolvedIdempotencyKey)
            )
          );
        return existingTxList[0];
      });

      if (existingRecord) {
        if (existingRecord.requestHash !== canonicalRequestHash) {
          return NextResponse.json(
            {
              success: false,
              code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
              message:
                'Konflik Idempotensi: Idempotency Key sama telah digunakan dengan payload transaksi yang berbeda',
            },
            { status: 409 }
          );
        }

        const replayPayload =
          existingRecord.responsePayload || {
            success: true,
            message: 'Pembayaran Kantin Berhasil (Replay)',
            data: {
              transactionId: existingRecord.id,
              amountDeducted: existingRecord.amount,
              vendorName: existingRecord.vendorName,
              itemsDescription: existingRecord.itemsDescription,
              timestamp: existingRecord.createdAt.toISOString(),
            },
          };

        const response = NextResponse.json(replayPayload, { status: 200 });
        response.headers.set('X-Idempotent-Replay', 'true');
        return response;
      }
    }

    // ── 3. Server-Side POS Catalog Validation ──────────────────────────────────────
    let resolvedItemsDescription = itemsDescription || 'Pembelian Kantin';
    const itemMap = new Map<string, typeof canteenItems.$inferSelect>();

    if (Array.isArray(items) && items.length > 0) {
      const itemIds: string[] = [];
      for (const orderItem of items) {
        const itemId = typeof orderItem.itemId === 'string' ? orderItem.itemId : undefined;
        if (!itemId) {
          return NextResponse.json(
            { success: false, code: 'INVALID_ITEM_PAYLOAD', message: 'Setiap item wajib memiliki itemId' },
            { status: 400 }
          );
        }
        if (
          typeof orderItem.qty !== 'number' ||
          !Number.isInteger(orderItem.qty) ||
          orderItem.qty <= 0
        ) {
          return NextResponse.json(
            { success: false, code: 'INVALID_ITEM_QTY', message: 'Kuantitas item harus berupa integer positif' },
            { status: 400 }
          );
        }
        if (orderItem.discount !== undefined && orderItem.discount !== null) {
          if (
            typeof orderItem.discount !== 'number' ||
            !Number.isInteger(orderItem.discount) ||
            orderItem.discount < 0
          ) {
            return NextResponse.json(
              { success: false, code: 'INVALID_ITEM_DISCOUNT', message: 'Diskon harus berupa integer non-negatif' },
              { status: 400 }
            );
          }
        }
        itemIds.push(itemId);
      }

      const catalogItems = await withTenantTransaction(tenant.id, async (tx) => {
        return tx
          .select()
          .from(canteenItems)
          .where(and(eq(canteenItems.tenantId, tenant.id), inArray(canteenItems.id, itemIds)));
      });

      for (const ci of catalogItems) {
        itemMap.set(ci.id, ci);
      }

      for (const reqItemId of itemIds) {
        const master = itemMap.get(reqItemId);
        if (!master) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_CATALOG_ITEM',
              message: `Barang dengan ID '${reqItemId}' tidak ditemukan dalam katalog kantin tenant ini`,
            },
            { status: 400 }
          );
        }

        if (canteenId && master.canteenId !== canteenId) {
          return NextResponse.json(
            {
              success: false,
              code: 'ITEM_CANTEEN_MISMATCH',
              message: `Barang '${master.name}' bukan bagian dari kantin yang dipilih`,
            },
            { status: 400 }
          );
        }

        if (master.status !== 'active') {
          return NextResponse.json(
            {
              success: false,
              code: 'ITEM_NOT_ACTIVE',
              message: `Barang '${master.name}' saat ini tidak aktif / habis stok`,
            },
            { status: 400 }
          );
        }
      }

      let calculatedTotal = 0;
      const itemNames: string[] = [];

      for (const orderItem of items) {
        const itemId = String(orderItem.itemId);
        const master = itemMap.get(itemId)!;
        const qty = Number(orderItem.qty) || 1;
        const discount = Number(orderItem.discount) || 0;
        const lineTotal = master.price * qty - discount;
        if (lineTotal < 0) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_ITEM_DISCOUNT',
              message: `Diskon barang '${master.name}' melebihi harga total`,
            },
            { status: 400 }
          );
        }
        calculatedTotal += lineTotal;
        itemNames.push(`${master.name} x${qty}`);
      }

      if (calculatedTotal !== amount) {
        return NextResponse.json(
          {
            success: false,
            code: 'PRICE_CALCULATION_MISMATCH',
            message: `Total belanja tidak sesuai dengan katalog server (Kalkulasi Server: Rp ${calculatedTotal.toLocaleString('id-ID')}, Dikirim: Rp ${amount.toLocaleString('id-ID')})`,
          },
          { status: 400 }
        );
      }

      if (itemNames.length > 0 && !itemsDescription) {
        resolvedItemsDescription = itemNames.join(', ');
      }
    }

    let resolvedVendorName = customVendorName;
    if (canteenId) {
      const canteenResult = await withTenantTransaction(tenant.id, async (tx) => {
        return tx
          .select()
          .from(canteens)
          .where(and(eq(canteens.tenantId, tenant.id), eq(canteens.id, canteenId)));
      });
      if (canteenResult[0]) {
        resolvedVendorName = canteenResult[0].name;
      }
    }

    // ── 4. Card Lookup & Persistent PIN Failure Lock ───────────────────────────────
    const card = await withTenantTransaction(tenant.id, async (tx) => {
      const cardResult = await tx
        .select()
        .from(rfidCards)
        .where(and(eq(rfidCards.tenantId, tenant.id), eq(rfidCards.cardUid, cardUid)));
      return cardResult[0];
    });

    if (!card) {
      return NextResponse.json(
        { success: false, code: 'CARD_NOT_FOUND', message: 'Kartu RFID tidak terdaftar dalam sistem' },
        { status: 404 }
      );
    }

    if (card.status === 'blocked' || (card.pinFailedAttempts || 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          code: 'CARD_BLOCKED',
          message:
            'Transaksi Ditolak: Kartu Diblokir/Dilaporkan Hilang atau Melebihi Batas Percobaan PIN. Hubungi Wali Kelas untuk reset PIN.',
        },
        { status: 403 }
      );
    }

    const isLegacyPlaintext = card.hashedPin.startsWith('pin_') || !isValidHex64(card.hashedPin);
    if (isLegacyPlaintext) {
      return NextResponse.json(
        {
          success: false,
          code: 'LEGACY_PIN_NEEDS_ACTIVATION',
          message:
            'Transaksi Ditolak: Kartu fisik santri memerlukan aktivasi/reset PIN baru oleh Wali Kelas sebelum dapat digunakan bertransaksi (Kebijakan PO DEC-03 Opsi A)',
        },
        { status: 403 }
      );
    }

    if (!card.salt || !isValidHex32(card.salt)) {
      return NextResponse.json(
        {
          success: false,
          code: 'LEGACY_CARD_MISSING_SALT',
          message:
            'Transaksi Ditolak: Kredensial kartu belum memiliki salt kriptografis yang valid. Hubungi Wali Kelas untuk reset PIN.',
        },
        { status: 403 }
      );
    }

    let pinValid = false;
    try {
      const verifyResult = verifyPinCredential(pin, {
        kdfVersion: card.kdfVersion,
        pepperVersion: card.pepperVersion,
        iterations: card.iterations,
        salt: card.salt,
        hashedPin: card.hashedPin,
      });
      pinValid = verifyResult.valid;
    } catch (kdfErr: unknown) {
      const msg = kdfErr instanceof Error ? kdfErr.message : String(kdfErr);
      if (msg.startsWith('FAIL_CLOSED')) {
        return NextResponse.json(
          {
            success: false,
            code: 'INTERNAL_SECURITY_CONFIG_ERROR',
            message: 'Kesalahan Konfigurasi Keamanan Server: Pepper rahasia tidak tersedia (Fail-Closed)',
          },
          { status: 500 }
        );
      }
      pinValid = false;
    }

    if (!pinValid) {
      const updatedFailed = (card.pinFailedAttempts || 0) + 1;
      const isNowBlocked = updatedFailed >= 3;

      await withTenantTransaction(tenant.id, async (tx) => {
        await tx
          .update(rfidCards)
          .set({
            pinFailedAttempts: updatedFailed,
            status: isNowBlocked ? 'blocked' : card.status,
            updatedAt: new Date(),
          })
          .where(and(eq(rfidCards.tenantId, tenant.id), eq(rfidCards.id, card.id)));
      });

      await financialAuditService.log({
        tenantId: tenant.id,
        correlationId: resolvedIdempotencyKey || `sec_${Date.now()}`,
        actorId: posCashierId,
        actorName: posCashierName,
        actorRole: 'kasir',
        action: isNowBlocked ? 'ANOMALY_FLAGGED' : 'CANTEEN_PAYMENT',
        targetEntity: 'canteen_transaction',
        targetId: card.id,
        amount,
        status: 'FAILED',
        metadata: {
          cardUid,
          failedAttempts: updatedFailed,
          reason: isNowBlocked ? 'CARD_BLOCKED_TOO_MANY_FAILED_ATTEMPTS' : 'INVALID_PIN',
        },
      });

      if (updatedFailed >= 3) {
        return NextResponse.json(
          {
            success: false,
            code: 'CARD_BLOCKED_TOO_MANY_FAILED_ATTEMPTS',
            message:
              'Kode PIN Salah 3 kali berturut-turut. Kartu telah DIBLOKIR demi keamanan. Hubungi Wali Kelas untuk reset PIN.',
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_PIN',
          message: 'Kode PIN / Sandi Santri Salah',
        },
        { status: 401 }
      );
    }

    if ((card.pinFailedAttempts || 0) > 0) {
      await withTenantTransaction(tenant.id, async (tx) => {
        await tx
          .update(rfidCards)
          .set({ pinFailedAttempts: 0, updatedAt: new Date() })
          .where(and(eq(rfidCards.tenantId, tenant.id), eq(rfidCards.id, card.id)));
      });
    }

    // ── 5. Atomic Financial Transaction with Row-Locking ───────────────────────────
    const result = await withTenantTransaction(tenant.id, async (tx) => {
      // 5a. Santri lookup inside transaction boundary
      const santriResult = await tx
        .select()
        .from(santri)
        .where(and(eq(santri.tenantId, tenant.id), eq(santri.id, card.santriId)));

      const santriObj = santriResult[0];
      if (!santriObj) {
        throw new Error('SANTRI_NOT_FOUND: Data Santri tidak ditemukan');
      }

      // 5b. Row-Lock Wallet for Concurrency Protection (FOR UPDATE)
      const walletResult = await tx
        .select()
        .from(wallets)
        .where(and(eq(wallets.tenantId, tenant.id), eq(wallets.santriId, card.santriId)))
        .for('update');

      const wallet = walletResult[0];
      if (!wallet) {
        throw new Error('WALLET_NOT_FOUND: Dompet Digital Santri belum dibuat');
      }

      // 5c. Canteen Freeze & Suspension Checks
      if (wallet.canteenStatus === 'suspended_by_walikelas') {
        throw new Error('CANTEEN_SUSPENDED_BY_WALIKELAS: Transaksi Ditolak: Fitur Belanja Kartu Dinonaktifkan Sementara oleh Wali Kelas');
      }
      if (wallet.canteenStatus === 'suspended_by_wali') {
        throw new Error('CANTEEN_SUSPENDED_BY_WALI: Transaksi Ditolak: Fitur Belanja Dinonaktifkan oleh Wali Santri');
      }
      if (wallet.canteenStatus === 'blocked') {
        throw new Error('WALLET_BLOCKED: Transaksi Ditolak: Kartu Belanja Diblokir');
      }

      // 5d. Daily Limit Enforcement (Inside Transaction Boundary)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayTxResult = await tx
        .select()
        .from(canteenTransactions)
        .where(
          and(
            eq(canteenTransactions.tenantId, tenant.id),
            eq(canteenTransactions.santriId, card.santriId),
            gte(canteenTransactions.createdAt, startOfToday)
          )
        );

      const totalSpentToday = todayTxResult.reduce((sum, t) => sum + t.amount, 0);
      const dailyLimit = wallet.dailyLimit || 20000;

      if (totalSpentToday + amount > dailyLimit) {
        const remainingLimit = Math.max(0, dailyLimit - totalSpentToday);
        throw new Error(`DAILY_LIMIT_EXCEEDED:${dailyLimit}:${remainingLimit}`);
      }

      // 5e. Zero-Overdraft Balance Check
      if (wallet.balanceUangSaku < amount) {
        throw new Error(`INSUFFICIENT_BALANCE:${wallet.balanceUangSaku}`);
      }

      // 5f. Atomic Balance Deduction (Uang Saku only; Tabungan strictly untouched)
      const newBalance = wallet.balanceUangSaku - amount;
      const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      await tx
        .update(wallets)
        .set({
          balanceUangSaku: newBalance,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.tenantId, tenant.id), eq(wallets.id, wallet.id), gte(wallets.balanceUangSaku, amount)));

      const newSpentToday = totalSpentToday + amount;
      const remainingLimit = Math.max(0, dailyLimit - newSpentToday);

      const responsePayload = {
        success: true,
        message: 'Pembayaran Kantin Berhasil',
        data: {
          transactionId: txId,
          santriName: santriObj.name,
          photoUrl: santriObj.photoUrl,
          kelas: santriObj.kelas,
          amountDeducted: amount,
          remainingBalanceUangSaku: newBalance,
          totalSpentToday: newSpentToday,
          dailyLimit,
          remainingDailyLimit: remainingLimit,
          vendorName: resolvedVendorName,
          itemsDescription: resolvedItemsDescription,
          timestamp: new Date().toISOString(),
        },
      };

      // 5g. Insert Canteen Transaction (with persistent idempotency metadata)
      await tx.insert(canteenTransactions).values({
        id: txId,
        tenantId: tenant.id,
        canteenId: canteenId || null,
        santriId: card.santriId,
        santriName: santriObj.name,
        cardUid,
        amount,
        itemsDescription: resolvedItemsDescription,
        vendorName: resolvedVendorName,
        posCashierId,
        status: 'SUCCESS',
        idempotencyKey: resolvedIdempotencyKey || null,
        requestHash: canonicalRequestHash || null,
        responsePayload,
      });

      // 5h. Insert Canteen Transaction Items (POS Structured Snapshot)
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemId = typeof item.itemId === 'string' ? item.itemId : undefined;
          const master = itemId ? itemMap.get(itemId) : undefined;
          const unitPrice = master ? master.price : (Number(item.price) || 0);
          const qty = Number(item.qty) || 1;
          const discount = Number(item.discount) || 0;
          const subtotal = unitPrice * qty - discount;

          await tx.insert(canteenTransactionItems).values({
            id: `item_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            tenantId: tenant.id,
            transactionId: txId,
            itemId: itemId || null,
            itemName: master?.name || (typeof item.name === 'string' ? item.name : 'Barang Kantin'),
            unitPrice,
            quantity: qty,
            discount,
            subtotal,
          });
        }
      }

      // 5i. Insert Wallet Pockets Mutation Log (Append-Only Audit)
      await tx.insert(walletPockets).values({
        id: `mut_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        tenantId: tenant.id,
        walletId: wallet.id,
        pocketType: 'uang_saku',
        mutationType: 'canteen_deduct',
        amount,
        balanceBefore: wallet.balanceUangSaku,
        balanceAfter: newBalance,
        description: `Belanja di ${resolvedVendorName}: ${resolvedItemsDescription}`,
        referenceId: txId,
      });

      // 5j. Credit Merchant Hak Pendapatan (Append-Only Central Escrow)
      await merchantLedgerService.recordCreditSale(
        {
          tenantId: tenant.id,
          canteenId: canteenId || tenant.id,
          amount,
          transactionId: txId,
          description: `Penjualan ${resolvedItemsDescription} di ${resolvedVendorName}`,
        },
        tx
      );

      // 5k. Append-Only Financial Audit Trail (Zero-Credential Leakage)
      await financialAuditService.log(
        {
          tenantId: tenant.id,
          correlationId: resolvedIdempotencyKey || txId,
          actorId: posCashierId,
          actorName: posCashierName,
          actorRole: 'kasir',
          action: 'CANTEEN_PAYMENT',
          targetEntity: 'canteen_transaction',
          targetId: txId,
          amount,
          stateBefore: { balanceUangSaku: wallet.balanceUangSaku },
          stateAfter: { balanceUangSaku: newBalance },
          status: 'SUCCESS',
          metadata: {
            santriId: card.santriId,
            cardUid,
            canteenId: canteenId || tenant.id,
            vendorName: resolvedVendorName,
          },
        },
        tx
      );

      return responsePayload;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[API /api/canteen/pay POST] Internal error:', error);
    const errorMsg = error instanceof Error ? String(error) : '';

    if (errorMsg.startsWith('DAILY_LIMIT_EXCEEDED:')) {
      const [, dailyLimitStr, remainingLimitStr] = errorMsg.split(':');
      const dailyLimit = Number(dailyLimitStr) || 20000;
      const remainingLimit = Number(remainingLimitStr) || 0;
      return NextResponse.json(
        {
          success: false,
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `Transaksi Ditolak: Kartu Mencapai Limit Belanja Harian di Seluruh Kantin (Maks Rp ${dailyLimit.toLocaleString('id-ID')}/hari). Sisa limit hari ini: Rp ${remainingLimit.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    if (errorMsg.startsWith('INSUFFICIENT_BALANCE:')) {
      const balanceStr = errorMsg.split(':')[1];
      const balance = Number(balanceStr) || 0;
      return NextResponse.json(
        {
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          message: `Saldo Uang Saku Tidak Cukup (Saldo: Rp ${balance.toLocaleString('id-ID')})`,
        },
        { status: 400 }
      );
    }

    if (errorMsg.startsWith('CANTEEN_SUSPENDED_') || errorMsg.startsWith('WALLET_BLOCKED')) {
      const message = errorMsg.includes(': ') ? errorMsg.split(': ')[1] : errorMsg;
      return NextResponse.json({ success: false, code: errorMsg.split(':')[0] || 'FORBIDDEN', message }, { status: 403 });
    }

    if (errorMsg.startsWith('SANTRI_NOT_FOUND') || errorMsg.startsWith('WALLET_NOT_FOUND')) {
      const message = errorMsg.includes(': ') ? errorMsg.split(': ')[1] : errorMsg;
      return NextResponse.json({ success: false, code: errorMsg.split(':')[0] || 'NOT_FOUND', message }, { status: 404 });
    }

    const errObj = error as { code?: string };
    if (errObj?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          code: 'CONCURRENT_IDEMPOTENT_TRANSACTION',
          message: 'Transaksi dengan idempotency key ini sedang atau telah diproses.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memproses pembayaran kantin' },
      { status: 500 }
    );
  }
}
