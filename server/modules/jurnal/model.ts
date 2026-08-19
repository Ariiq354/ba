import { z } from "zod";
import { paginationSearchSchema } from "~~/server/utils/schema";

export const getJurnalQuerySchema = z.object({
  ...paginationSearchSchema.shape,
});

export type GetJurnalQuerySchema = z.infer<typeof getJurnalQuerySchema>;

export const jurnalDetailItemSchema = z.object({
  akunId: z.number().int({ message: "Akun wajib dipilih" }),
  debit: z.coerce.number().min(0).default(0),
  kredit: z.coerce.number().min(0).default(0),
});

export type JurnalDetailItemSchema = z.infer<typeof jurnalDetailItemSchema>;

export const createJurnalSchema = z
  .object({
    tanggalTransaksi: z.string().min(1, "Tanggal transaksi wajib diisi"),
    keterangan: z.string().optional(),
    details: z
      .array(jurnalDetailItemSchema)
      .min(2, "Minimal 2 baris transaksi (1 Debit & 1 Kredit)"),
  })
  .superRefine((data, ctx) => {
    const totalDebit = data.details.reduce((sum, d) => sum + (d.debit || 0), 0);
    const totalKredit = data.details.reduce((sum, d) => sum + (d.kredit || 0), 0);

    if (totalDebit <= 0 || totalKredit <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Nominal transaksi harus lebih dari 0",
        path: ["details"],
      });
    }

    if (totalDebit !== totalKredit) {
      ctx.addIssue({
        code: "custom",
        message: `Total Debit (${totalDebit}) harus sama dengan Total Kredit (${totalKredit})`,
        path: ["details"],
      });
    }
  });

export type CreateJurnalSchema = z.infer<typeof createJurnalSchema>;
