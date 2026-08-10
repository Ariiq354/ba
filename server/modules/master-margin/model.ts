import { z } from "zod";

export const marginJaminanEnum = z.enum(["TIDAK_ADA", "ADA"]);

export const createMarginSchema = z.object({
  minNominal: z.number().min(0),
  maxNominal: z.number().min(0),
  persenMarginTahun: z.number().min(0),
  jaminan: marginJaminanEnum,
  biayaAkad: z.number().min(0),
});

export type CreateMarginSchema = z.infer<typeof createMarginSchema>;

export const updateMarginSchema = createMarginSchema.partial();

export type UpdateMarginSchema = z.infer<typeof updateMarginSchema>;
