import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { UBadge } from "#components";

export type KategoriAkun = "aktiva" | "pasiva" | "pendapatan" | "biaya";
export type NormalBalance = "debit" | "kredit";

export interface AkunItem {
  id: number;
  kodeAkun: string;
  namaAkun: string;
  kategori: KategoriAkun;
  normalBalance: NormalBalance;
  isActive: boolean;
  createdAt?: string;
}

export const akunSchema = z.object({
  kodeAkun: z.string({ message: "Kode akun wajib diisi" }).min(1, "Kode akun wajib diisi"),
  namaAkun: z.string({ message: "Nama akun wajib diisi" }).min(1, "Nama akun wajib diisi"),
  kategori: z.enum(["aktiva", "pasiva", "pendapatan", "biaya"], { message: "Kategori akun wajib dipilih" }),
  normalBalance: z.enum(["debit", "kredit"], { message: "Normal balance wajib dipilih" }),
  isActive: z.boolean().default(true),
});

export type AkunFormSchema = z.infer<typeof akunSchema>;

export const kategoriFilterOptions = [
  { label: "Semua Kategori", value: "all" },
  { label: "Aktiva", value: "aktiva" },
  { label: "Pasiva", value: "pasiva" },
  { label: "Pendapatan", value: "pendapatan" },
  { label: "Biaya", value: "biaya" },
];

const kategoriLabels: Record<KategoriAkun, string> = {
  aktiva: "Aktiva",
  pasiva: "Pasiva",
  pendapatan: "Pendapatan",
  biaya: "Biaya",
};

const kategoriColors: Record<KategoriAkun, "info" | "warning" | "success" | "error"> = {
  aktiva: "info",
  pasiva: "warning",
  pendapatan: "success",
  biaya: "error",
};

export const akunColumns: TableColumn<AkunItem>[] = [
  {
    header: "Kode Akun",
    accessorKey: "kodeAkun",
  },
  {
    header: "Nama Akun",
    accessorKey: "namaAkun",
  },
  {
    header: "Kategori",
    accessorKey: "kategori",
    cell: ({ row }) => {
      const cat = row.original.kategori;
      return h(
        UBadge,
        {
          color: kategoriColors[cat] || "neutral",
          variant: "subtle",
          size: "sm",
        },
        () => kategoriLabels[cat] || cat,
      );
    },
  },
  {
    header: "Normal Balance",
    accessorKey: "normalBalance",
    cell: ({ row }) => {
      const isDebit = row.original.normalBalance === "debit";
      return h(
        UBadge,
        {
          color: isDebit ? "primary" : "neutral",
          variant: "outline",
          size: "sm",
        },
        () => isDebit ? "Debit" : "Kredit",
      );
    },
  },
  {
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => {
      const active = row.original.isActive;
      return h(
        UBadge,
        {
          color: active ? "success" : "neutral",
          variant: "subtle",
          size: "sm",
        },
        () => active ? "Aktif" : "Nonaktif",
      );
    },
  },
];
