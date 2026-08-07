import { z } from "zod";

export const kotaQuerySchema = z.object({
  idProvinsi: z.string(),
});

export const kecamatanQuerySchema = z.object({
  idKota: z.string(),
});

export const kelurahanQuerySchema = z.object({
  idKecamatan: z.string(),
});
