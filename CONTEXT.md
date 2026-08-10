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
