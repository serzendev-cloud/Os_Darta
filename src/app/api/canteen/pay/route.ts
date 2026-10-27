// ========================================
// RFID Canteen POS Payment API Endpoint (Multi-Canteen & Catalog Supported)
// Hardened with Persistent DB-Backed Idempotency, Row Locking,
// Atomic Multi-Table Transaction, Server-side Pricing, & Persistent PIN Lock
// Work Package: WP-M2-FINANCE-WALLET-RFID-HARDENING-002
// ========================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
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

export async function POST(request: Request) {
  try {
    // ── 0. Context & Input Parsing ──────────────────────────────────────────────────
    const headerIdempotencyKey =
      request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');
    const headerTenantId = request.headers.get('x-tenant-id');

    const body = await request.json();
    const {
      cardUid,
      pin,
      amount,
      canteenId,
      vendorName: customVendorName = 'Kantin Utama',
      itemsDescription,
      posCashierId = 'POS-1',
      tenantId: bodyTenantId,
      items, // Structured items: Array<{ itemId: string; qty: number; discount?: number }>
      idempotencyKey: bodyIdempotencyKey,
    } = body;

    // Zero-Trust Tenant Resolution: Server proxy header takes precedence
    const tenantId = (headerTenantId || bodyTenantId || 'default').trim();
    const resolvedIdempotencyKey = headerIdempotencyKey || bodyIdempotencyKey;

    // ── 1. Validasi Input Dasar ────────────────────────────────────────────────────
    if (!cardUid || !pin || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: 'Card UID, PIN, dan Nominal Belanja wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal transaksi harus berupa integer rupiah lebih dari 0' },
        { status: 400 }
      );
    }

    // ── 2. Database-Backed Idempotency & Anti-Replay Guard (WP-B) ───────────────────
    let canonicalRequestHash = '';
    if (resolvedIdempotencyKey) {
      // Deterministic canonical payload excluding raw PIN
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
        tenantId,
        canteenId: canteenId || null,
        cardUid,
        amount,
        items: canonicalItems,
      };

      canonicalRequestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(canonicalObject))
        .digest('hex');

      // Check persistent canteen_transactions table for existing key within tenant
      const existingTxList = await db
        .select()
        .from(canteenTransactions)
        .where(
          and(
            eq(canteenTransactions.tenantId, tenantId),
            eq(canteenTransactions.idempotencyKey, resolvedIdempotencyKey)
          )
        );

      const existingRecord = existingTxList[0];
      if (existingRecord) {
        // Same key, different payload -> HTTP 409 Conflict
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

        // Same key, identical payload -> Replay stored response safely without re-debiting
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

    // ── 3. Server-Side POS Catalog Validation (WP-E) ───────────────────────────────
    let resolvedItemsDescription = itemsDescription || 'Pembelian Kantin';
    const itemMap = new Map<string, typeof canteenItems.$inferSelect>();

    if (Array.isArray(items) && items.length > 0) {
      const itemIds: string[] = [];
      for (const orderItem of items) {
        if (!orderItem.itemId) {
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
        itemIds.push(orderItem.itemId);
      }

      const catalogItems = await db
        .select()
        .from(canteenItems)
        .where(and(eq(canteenItems.tenantId, tenantId), inArray(canteenItems.id, itemIds)));

      for (const ci of catalogItems) {
        itemMap.set(ci.id, ci);
      }

      // Verify all items exist in catalog and belong to tenant
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

        // Verify item belongs to supplied canteen
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

        // Verify item status is active
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

      // Server-side SSOT price calculation (ignore client price)
      let calculatedTotal = 0;
      const itemNames: string[] = [];

      for (const orderItem of items) {
        const master = itemMap.get(orderItem.itemId)!;
        const qty = orderItem.qty || 1;
        const discount = orderItem.discount || 0;
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

    // Lookup Canteen name if canteenId supplied
    let resolvedVendorName = customVendorName;
    if (canteenId) {
      const canteenResult = await db
        .select()
        .from(canteens)
        .where(and(eq(canteens.tenantId, tenantId), eq(canteens.id, canteenId)));
      if (canteenResult[0]) {
        resolvedVendorName = canteenResult[0].name;
      }
    }

    // ── 4. Card Lookup & Persistent PIN Failure Lock (WP-C & WP-D) ────────────────
    const cardResult = await db
      .select()
      .from(rfidCards)
      .where(and(eq(rfidCards.tenantId, tenantId), eq(rfidCards.cardUid, cardUid)));

    const card = cardResult[0];
    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Kartu RFID tidak terdaftar dalam sistem' },
        { status: 404 }
      );
    }

    // Persistent PIN Failure Lock Check: 3 failures blocks card
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

    // PO DEC-03 Option A: Reject legacy plaintext or unmigrated cards
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

    // Reject cards with missing or invalid salt fail-closed (no deterministic fallback)
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

    // Verify PIN with constant-time decoupled cryptography
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
      // Increment persistent failure count in database
      const updatedFailed = (card.pinFailedAttempts || 0) + 1;
      const isNowBlocked = updatedFailed >= 3;

      await db
        .update(rfidCards)
        .set({
          pinFailedAttempts: updatedFailed,
          status: isNowBlocked ? 'blocked' : card.status,
          updatedAt: new Date(),
        })
        .where(and(eq(rfidCards.tenantId, tenantId), eq(rfidCards.id, card.id)));

      // Append security audit event (Strictly NO PIN leakage)
      await financialAuditService.log({
        tenantId,
        correlationId: resolvedIdempotencyKey || `sec_${Date.now()}`,
        actorId: posCashierId,
        actorName: `Kasir ${posCashierId}`,
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

    // Reset failed counter persistently in DB on successful PIN verification
    if ((card.pinFailedAttempts || 0) > 0) {
      await db
        .update(rfidCards)
        .set({ pinFailedAttempts: 0, updatedAt: new Date() })
        .where(and(eq(rfidCards.tenantId, tenantId), eq(rfidCards.id, card.id)));
    }

    // ── 5. Atomic Financial Transaction with Row-Locking (WP-A, WP-F) ───────────────
    // All balance deduction, transaction logging, item snapshot, and pocket mutations
    // run inside an isolated, atomic database transaction with RLS session scoping.
    const result = await withTenantTransaction(tenantId, async (tx) => {
      // 5a. Santri lookup inside transaction boundary
      const santriResult = await tx
        .select()
        .from(santri)
        .where(and(eq(santri.tenantId, tenantId), eq(santri.id, card.santriId)));

      const santriObj = santriResult[0];
      if (!santriObj) {
        throw new Error('SANTRI_NOT_FOUND: Data Santri tidak ditemukan');
      }

      // 5b. Row-Lock Wallet for Concurrency Protection (FOR UPDATE)
      const walletResult = await tx
        .select()
        .from(wallets)
        .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, card.santriId)))
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
            eq(canteenTransactions.tenantId, tenantId),
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

      // 5e. Zero-Overdraft Balance Check (DEC-08 Fail-Closed)
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
        .where(and(eq(wallets.tenantId, tenantId), eq(wallets.id, wallet.id), gte(wallets.balanceUangSaku, amount)));

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
        tenantId,
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
          const master = itemMap.get(item.itemId);
          const unitPrice = master ? master.price : (item.price || 0);
          const qty = item.qty || 1;
          const discount = item.discount || 0;
          const subtotal = unitPrice * qty - discount;

          await tx.insert(canteenTransactionItems).values({
            id: `item_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            tenantId,
            transactionId: txId,
            itemId: item.itemId || null,
            itemName: master?.name || item.name || 'Barang Kantin',
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
        tenantId,
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
          tenantId,
          canteenId: canteenId || 'default',
          amount,
          transactionId: txId,
          description: `Penjualan ${resolvedItemsDescription} di ${resolvedVendorName}`,
        },
        tx
      );

      // 5k. Append-Only Financial Audit Trail (Zero-Credential Leakage)
      await financialAuditService.log(
        {
          tenantId,
          correlationId: resolvedIdempotencyKey || txId,
          actorId: posCashierId,
          actorName: `Kasir ${posCashierId}`,
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
            canteenId: canteenId || 'default',
            vendorName: resolvedVendorName,
          },
        },
        tx
      );

      return responsePayload;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Business exception mapping
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
      return NextResponse.json({ success: false, message }, { status: 403 });
    }

    if (errorMsg.startsWith('SANTRI_NOT_FOUND') || errorMsg.startsWith('WALLET_NOT_FOUND')) {
      const message = errorMsg.includes(': ') ? errorMsg.split(': ')[1] : errorMsg;
      return NextResponse.json({ success: false, message }, { status: 404 });
    }

    // Handle Postgres Unique Constraint Violation (concurrent idempotency replay race)
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

    // Default sanitized internal server error (never leak credentials or stack traces)
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memproses pembayaran kantin' },
      { status: 500 }
    );
  }
}
