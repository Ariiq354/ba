import { z } from "zod";

export const kotaQuerySchema = z.object({
  idProvinsi: z.string(),
});
export type KotaQuerySchema = z.infer<typeof kotaQuerySchema>;

export const kecamatanQuerySchema = z.object({
  idKota: z.string(),
});
export type KecamatanQuerySchema = z.infer<typeof kecamatanQuerySchema>;

export const kelurahanQuerySchema = z.object({
  idKecamatan: z.string(),
});
export type KelurahanQuerySchema = z.infer<typeof kelurahanQuerySchema>;
