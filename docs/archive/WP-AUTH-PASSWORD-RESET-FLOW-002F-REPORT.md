# WP-AUTH-PASSWORD-RESET-FLOW-002F REPORT
## Resend API Key Rotation & Vercel Preview Environment Repair

**Date**: October 01, 2026  
**Status**: **IN PROGRESS — AWAITING PRODUCT OWNER SECRET INPUT IN VERCEL DASHBOARD**  
**Role**: Senior Architectural Partner & Verification Agent  
**Safety Compliance**: 0 Production Mutations, 0 Database Schema Migrations, 0 Code Mutations, Production Baseline Untouched (`a4a7e1a`), Customer Admin Untouched (`abu.thohir.zmr92@gmail.com`).

---

## 1. Objective
Melakukan perbaikan kredensial Resend pada lingkungan Vercel Preview menyusul insiden keterpaparan kunci API sebelumnya. Prosedur ini mencakup rotasi penuh kunci API Resend baru oleh Product Owner langsung pada UI Vercel (tanpa membagikan secret kepada agen), eksekusi redeploy terkontrol pada branch `preview`, dan penyiapan sistem untuk validasi E2E akhir.

---

## 2. Security Incident Note & Secret Hygiene
- **Catatan Insiden**: Kunci API lama yang sempat tercatat pada draf laporan sebelumnya dinyatakan **COMPROMISED (TIDAK BOLEH DIGUNAKAN LAGI)**.
- **Tindakan Sanitasi**: String kunci lama telah dihapus dan diredaksi dari seluruh dokumentasi lokal.
- **Protokol Kerahasiaan WP-002F**: Kunci baru yang dibuat **TIDAK BOLEH** dibagikan melalui chat, log, terminal, atau file teks. Product Owner memasukkannya langsung ke dasbor Vercel.

---

## 3. Preflight Evidence (Phase 0)

| Entitas | Status Baseline | Verifikasi |
| :--- | :--- | :---: |
| **Git Current Branch** | `preview` | ✅ Terkonfirmasi |
| **Git Working Tree** | Bersih dari modifikasi file terlacak (`git status --short`) | ✅ Bersih |
| **Production Branch** | `main = a4a7e1a` | ✅ Terkunci |
| **Production Domain** | `https://pp-darunnajah.serzen-dev.my.id` (HTTP 200) | ✅ Terisolasi |
| **Vercel Project** | `os-darta` (`prj_fdARhHk53BT2w84tZBUVq23mqEQJ`) | ✅ Terhubung |
| **`RESEND_API_KEY` (Preview)** | `PRESENT` (Status: Menunggu rotasi ke kunci baru oleh PO) | ⏳ Siap Diperbarui |
| **`RESEND_API_KEY` (Production)**| `PRESENT` (Status: Strictly UNTOUCHED di WP ini) | ✅ Terlindungi |

---

## 4. Resend Key Rotation (Phase 1) & Vercel Update (Phase 2)
- **Status Rotasi**: Menunggu Product Owner membuat API Key baru di [Resend Dashboard](https://resend.com/api-keys) dengan izin pengiriman domain `serzen-dev.my.id`.
- **Target Pemasukan Kunci**:
  - Buka **Vercel Dashboard** $\rightarrow$ Project **`os-darta`** $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
  - Temukan **`RESEND_API_KEY`** $\rightarrow$ Edit atau ganti nilai untuk environment **`Preview`**.
  - Simpan (*Save*).
  - *Catatan Ketat*: Environment `Production` **TIDAK DIUBAH** dalam WP ini.

---

## 5. Next Steps (Phase 3 — Phase 4)
Segera setelah Product Owner mengonfirmasi bahwa kunci baru telah disimpan di Vercel:
1. Agen akan menjalankan redeployment Preview (`npx vercel redeploy ... --target preview`).
2. Menunggu status **`● Ready`**.
3. Melaporkan checkpoint **`PREVIEW REPAIRED — READY FOR E2E`** (HARD STOP sebelum pengujian browser manual).
