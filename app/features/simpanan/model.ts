import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";

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

export const setoranSchema = z.object({
  akunId: z.number({ message: "Sumber rekening wajib dipilih" }).min(1, "Sumber rekening wajib dipilih"),
  nilaiTransaksi: z.coerce.number({ message: "Nominal setoran wajib diisi" }).min(1000, "Nominal setoran minimal Rp 1.000"),
  keterangan: z.string().optional(),
});
export type SetoranFormSchema = z.infer<typeof setoranSchema>;

export const penarikanSchema = z.object({
  akunId: z.number({ message: "Tujuan pencairan wajib dipilih" }).min(1, "Tujuan pencairan wajib dipilih"),
  nilaiTransaksi: z.coerce.number({ message: "Nominal penarikan wajib diisi" }).min(1000, "Nominal penarikan minimal Rp 1.000"),
  keterangan: z.string().optional(),
});
export type PenarikanFormSchema = z.infer<typeof penarikanSchema>;

export const setorSahamSchema = z.object({
  akunId: z.number({ message: "Sumber pembayaran wajib dipilih" }).min(1, "Sumber pembayaran wajib dipilih"),
  jumlahLembar: z.coerce.number({ message: "Jumlah lembar saham wajib diisi" }).min(1, "Jumlah lembar saham minimal 1"),
  keterangan: z.string().optional(),
});
export type SetorSahamFormSchema = z.infer<typeof setorSahamSchema>;

export const rejectMutasiSchema = z.object({
  alasanPenolakan: z.string({ message: "Alasan penolakan wajib diisi" }).min(1, "Alasan penolakan wajib diisi"),
});
export type RejectMutasiFormSchema = z.infer<typeof rejectMutasiSchema>;

export const simpananMutasiColumns: TableColumn<MutasiItem>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "tanggalTransaksi", header: "Tanggal" },
  { accessorKey: "jenisTransaksi", header: "Jenis" },
  { accessorKey: "namaAkun", header: "Pembayaran" },
  { accessorKey: "nilaiTransaksi", header: "Nominal" },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "keterangan", header: "Keterangan" },
  { id: "actions", header: "Aksi" },
];

export const approvalMutasiColumns: TableColumn<MutasiItem>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "userName", header: "Anggota / User" },
  { accessorKey: "tanggalTransaksi", header: "Tanggal" },
  { accessorKey: "jenisTransaksi", header: "Jenis" },
  { accessorKey: "namaAkun", header: "Pembayaran" },
  { accessorKey: "nilaiTransaksi", header: "Nominal" },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "keterangan", header: "Keterangan" },
  { id: "actions", header: "Aksi Persetujuan" },
];

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
