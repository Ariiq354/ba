import { z } from "zod";

export const createSahamSchema = z.object({
  hargaNominal: z.number().min(0),
  hargaJual: z.number().min(0),
});

export type CreateSahamSchema = z.infer<typeof createSahamSchema>;
