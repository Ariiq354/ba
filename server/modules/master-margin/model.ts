import { z } from "zod";

export const marginJaminanEnum = z.enum(["TIDAK_ADA", "ADA"]);

export const createMarginSchema = z.object({
  minNominal: z.number().min(0),
  maxNominal: z.number().min(0),
  persenMarginTahun: z.number().min(0),
  jaminan: marginJaminanEnum,
  biayaAkad: z.number().min(0),
});

export const updateMarginSchema = createMarginSchema.partial();

export const marginQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const marginParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateMarginInput = z.infer<typeof createMarginSchema>;
export type UpdateMarginInput = z.infer<typeof updateMarginSchema>;
export type MarginQueryInput = z.infer<typeof marginQuerySchema>;
export type MarginParamsInput = z.infer<typeof marginParamsSchema>;
