import { z } from "zod";
import { AkunId } from "~~/shared/akunId";

export const validAktivaAkunIds = [
  AkunId.KAS,
  AkunId.BANKMUAMALAT,
  AkunId.BANKBSM,
  AkunId.BANKBCA,
] as const;

export const aktivaAkunSchema = z.number().refine(
  val => validAktivaAkunIds.includes(val as typeof validAktivaAkunIds[number]),
  { message: "Akun pembayaran harus Kas, Bank Muamalat, Bank BSM, atau Bank BCA" },
);

export const createSetoranSchema = z.object({
  akunId: aktivaAkunSchema,
  nilaiTransaksi: z.number({ message: "Nilai transaksi wajib diisi" })
    .int("Nilai transaksi harus berupa angka bulat")
    .positive("Nilai transaksi harus lebih dari 0"),
  keterangan: z.string().optional().nullable(),
});

export const createPenarikanSchema = z.object({
  akunId: aktivaAkunSchema,
  nilaiTransaksi: z.number({ message: "Nilai penarikan wajib diisi" })
    .int("Nilai penarikan harus berupa angka bulat")
    .positive("Nilai penarikan harus lebih dari 0"),
  keterangan: z.string().optional().nullable(),
});

export const createSetorSahamSchema = z.object({
  akunId: aktivaAkunSchema,
  jumlahLembar: z.number({ message: "Jumlah lembar saham wajib diisi" })
    .int("Jumlah lembar saham harus berupa angka bulat")
    .positive("Jumlah lembar saham minimal 1 lembar"),
  keterangan: z.string().optional().nullable(),
});

export const rejectMutasiSchema = z.object({
  alasanPenolakan: z.string().min(1, "Alasan penolakan wajib diisi"),
});

export const getMutasiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  jenisTransaksi: z.enum(["setoran", "penarikan"]).optional(),
  search: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export type CreateSetoranInput = z.infer<typeof createSetoranSchema>;
export type CreatePenarikanInput = z.infer<typeof createPenarikanSchema>;
export type CreateSetorSahamInput = z.infer<typeof createSetorSahamSchema>;
export type RejectMutasiInput = z.infer<typeof rejectMutasiSchema>;
export type GetMutasiQueryInput = z.infer<typeof getMutasiQuerySchema>;
