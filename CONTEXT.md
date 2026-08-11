# Core System Context & Domain Glossary

This repository handles the core system for the member financial portal (Koperasi / Islamic Finance Portal).

## Domain Terminology

### Member Portfolio Concepts

- **Simpanan (Savings / Deposits)**
  The total monetary deposits held by a user/member in the portal (e.g. Simpanan Pokok, Simpanan Wajib, Simpanan Sukarela).

- **Saham (Share Capital / Equity)**
  The member's ownership share value or capital contribution within the institution.

- **Pembiayaan (Financing / Loans)**
  The financing balance disbursed to or active for the member. Pertumbuhan Pembiayaan tracks the nominal growth of active financing over monthly periods.

- **Laba / Bagi Hasil (Profit Share / Dividends)**
  The net return or dividend allocated to the member based on institutional performance and agreement (Mudharabah/Musyarakah). Pertumbuhan Laba tracks monthly accumulated profit distributions in IDR.

- **Dashboard Overview**
  The personal financial view aggregating top-level KPI cards (Simpanan, Saham, Pembiayaan, Bagi Hasil) alongside monthly growth trend visualisations.

### Master Data Configurations

- **Master Saham (Share Pricing Log)**
  Historical nominal and selling price settings for member equity shares (`hargaNominal`, `hargaJual`), tracked with creator audit (`updatedBy`). New entries append historical price points rather than overwriting existing records.

- **Master Margin (Margin & Fee Tiering)**
  Configuration tiers for financing margin percentages and contract fees (`biayaAkad`), parametrized by nominal financing bounds (`minNominal`, `maxNominal`), yearly margin percentage (`persenMarginTahun`), and collateral status (`jaminan`: `ADA` | `TIDAK_ADA`).

- **Master Akun (Daftar Akun / Chart of Accounts)**
  Master ledger accounts for financial transactions (`kodeAkun`, `namaAkun`, `kategori`, `normalBalance`, `isActive`). Categories include `aktiva`, `pasiva`, `pendapatan`, and `biaya` with `debit` or `kredit` normal balance position. Supports filtering by category and case-insensitive search on account code and name.

### Member Management & Lifecycle

- **Verifikasi Akun (Member Account Verification)**
  Validation process performed by administrators to approve pending registered accounts (which default to `banned: true` with `banReason: "Akun belum terverifikasi"`). Verification unbans the user (`banned: false`) and generates a unique Member Number (`noAnggota`).

- **Nomor Anggota (`noAnggota`)**
  Unique member identification string assigned upon account verification. Formatted as `{kodeKelompok}-{MMYY}-{nomor}` (e.g. `KD-0126-0001`), where `nomor` is a 4-digit zero-padded sequence that resets monthly per `kelompok`.

- **Penanggung Jawab (PJ)**
  A verified member (`banned: false`, non-admin) assigned by an Administrator to oversee their designated group (`idKelompok`). Users with `role: "admin"` are superusers and cannot be set as PJ. When assigned, the user's `role` changes to `"pj"` and a record is created in `kelompok_penanggung_jawab`. Revoking PJ status returns the `role` to `"user"` and removes the group mapping.

### Accounting & Transactions

- **Jurnal Transaksi (General Journal Entries)**
  Double-entry journal records consisting of 1 header (`jurnal`: `kodeTransaksi`, `tanggalTransaksi`, `keterangan`, `userId`) and multiple detail lines (`jurnalDetail`: `akunId`, `debit`, `kredit`). Requires strict balance validation (`Sum(Debit) == Sum(Kredit)`). Formatted with auto-generated code prefix `TRX-{YYYYMM}-{SEQ}`. Journal entries are immutable (cannot be edited directly; admins may only create new entries or delete existing ones).


