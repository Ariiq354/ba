import { z } from "zod";
import { paginationSearchSchema } from "~~/server/utils/schema";

export const kategoriAkunEnum = z.enum(["aktiva", "pasiva", "pendapatan", "biaya"]);
export const normalBalanceEnum = z.enum(["debit", "kredit"]);

export const getAkunQuerySchema = z.object({
  ...paginationSearchSchema.shape,
  kategori: z.enum(["all", "aktiva", "pasiva", "pendapatan", "biaya"]).default("all"),
});

export type GetAkunQuerySchema = z.infer<typeof getAkunQuerySchema>;

export const createAkunSchema = z.object({
  kodeAkun: z.string().min(1, "Kode akun wajib diisi"),
  namaAkun: z.string().min(1, "Nama akun wajib diisi"),
  kategori: kategoriAkunEnum,
  normalBalance: normalBalanceEnum,
  isActive: z.boolean().default(true),
});

export type CreateAkunSchema = z.infer<typeof createAkunSchema>;

export const updateAkunSchema = createAkunSchema.partial();

export type UpdateAkunSchema = z.infer<typeof updateAkunSchema>;
