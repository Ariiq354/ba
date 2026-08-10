import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { UBadge } from "#components";
import { formatRupiah } from "~/utils/formatter";

export interface MarginItem {
  id: number;
  minNominal: number;
  maxNominal: number;
  persenMarginTahun: number;
  jaminan: "ADA" | "TIDAK_ADA";
  biayaAkad: number;
  createdAt?: string;
  updatedAt?: string;
}

export const marginSchema = z.object({
  minNominal: z.coerce.number({ message: "Minimal nominal wajib diisi" }).min(0, "Minimal nominal tidak boleh negatif"),
  maxNominal: z.coerce.number({ message: "Maksimal nominal wajib diisi" }).min(0, "Maksimal nominal tidak boleh negatif"),
  persenMarginTahun: z.coerce.number({ message: "Persen margin wajib diisi" }).min(0, "Persen margin tidak boleh negatif"),
  jaminan: z.enum(["TIDAK_ADA", "ADA"], { message: "Status jaminan wajib dipilih" }),
  biayaAkad: z.coerce.number({ message: "Biaya akad wajib diisi" }).min(0, "Biaya akad tidak boleh negatif"),
}).refine(data => data.maxNominal >= data.minNominal, {
  message: "Maksimal nominal harus lebih besar atau sama dengan minimal nominal",
  path: ["maxNominal"],
});

export type MarginFormSchema = z.infer<typeof marginSchema>;

export const marginColumns: TableColumn<MarginItem>[] = [
  {
    header: "Min. Nominal",
    accessorKey: "minNominal",
    cell: ({ row }) => formatRupiah(row.original.minNominal),
  },
  {
    header: "Max. Nominal",
    accessorKey: "maxNominal",
    cell: ({ row }) => formatRupiah(row.original.maxNominal),
  },
  {
    header: "Margin / Thn",
    accessorKey: "persenMarginTahun",
    cell: ({ row }) => `${row.original.persenMarginTahun}%`,
  },
  {
    header: "Biaya Akad",
    accessorKey: "biayaAkad",
    cell: ({ row }) => formatRupiah(row.original.biayaAkad),
  },
  {
    header: "Jaminan",
    accessorKey: "jaminan",
    cell: ({ row }) => {
      const isAda = row.original.jaminan === "ADA";
      return h(
        UBadge,
        {
          color: isAda ? "success" : "neutral",
          variant: "subtle",
          size: "sm",
        },
        () => (isAda ? "Ada Jaminan" : "Tanpa Jaminan"),
      );
    },
  },
];
