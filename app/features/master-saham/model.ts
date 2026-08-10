import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatDate, formatRupiah } from "~/utils/formatter";

export interface SahamItem {
  id: number;
  hargaNominal: number;
  hargaJual: number;
  updatedBy: number;
  createdAt: string;
  updatedByName?: string | null;
}

export const sahamSchema = z.object({
  hargaNominal: z.coerce.number({ message: "Harga nominal wajib diisi" }).min(0, "Harga nominal tidak boleh negatif"),
  hargaJual: z.coerce.number({ message: "Harga jual wajib diisi" }).min(0, "Harga jual tidak boleh negatif"),
});

export type SahamFormSchema = z.infer<typeof sahamSchema>;

export const sahamColumns: TableColumn<SahamItem>[] = [
  {
    header: "Harga Nominal",
    accessorKey: "hargaNominal",
    cell: ({ row }) => formatRupiah(row.original.hargaNominal),
  },
  {
    header: "Harga Jual",
    accessorKey: "hargaJual",
    cell: ({ row }) => formatRupiah(row.original.hargaJual),
  },
  {
    header: "Tanggal Perubahan",
    accessorKey: "createdAt",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    header: "Diubah Oleh",
    accessorKey: "updatedByName",
    cell: ({ row }) => row.original.updatedByName || `User #${row.original.updatedBy}`,
  },
];
