export interface FlatJurnalRow {
  id: number;
  jurnalId: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  keterangan: string | null;
  userId: number;
  userName: string | null;
  akunId: number;
  kodeAkun: string;
  namaAkun: string;
  debit: number;
  kredit: number;
  createdAt: string;
  totalDetailsCount: number;
}

export interface JurnalItem {
  id: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  keterangan: string | null;
  userId: number;
  userName: string | null;
  details: {
    id: number;
    akunId: number;
    kodeAkun: string;
    namaAkun: string;
    debit: number;
    kredit: number;
  }[];
}

export interface FormDetailLine {
  akunId: number | undefined;
  nominal: number;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
