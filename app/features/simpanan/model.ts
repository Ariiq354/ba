export interface SaldoResponse {
  saldoTabungan: number;
  saldoSaham: number;
  sumPendingPenarikan: number;
  effectiveSaldo: number;
}

export interface SahamPriceResponse {
  id: number;
  hargaNominal: number;
  hargaJual: number;
  updatedBy: number;
  createdAt: string;
}

export interface MutasiItem {
  id: number;
  kodeTransaksi: string;
  userId: number;
  userName: string | null;
  akunId: number;
  kodeAkun: string | null;
  namaAkun: string | null;
  jenisTransaksi: "setoran" | "penarikan";
  nilaiTransaksi: number;
  agioSaham: number;
  saldoSetelahTransaksi: number;
  tanggalTransaksi: string;
  statusApproved: "pending" | "approved" | "rejected";
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface PaginatedMutasiResponse {
  items: MutasiItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AktivaOption {
  id: number;
  label: string;
  value: number;
}

export const AKTIVA_OPTIONS: AktivaOption[] = [
  { id: 1, label: "Kas (101.01)", value: 1 },
  { id: 2, label: "Bank Muamalat (102.01)", value: 2 },
  { id: 57, label: "Bank BSM (102.02)", value: 57 },
  { id: 58, label: "Bank BCA (102.03)", value: 58 },
];
