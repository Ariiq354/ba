import { z } from "zod";

export const createSahamSchema = z.object({
  hargaNominal: z.number().min(0),
  hargaJual: z.number().min(0),
});

export const sahamQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});
