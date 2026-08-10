import type { z } from "zod";
import type { createSahamSchema, sahamQuerySchema } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterSahamRepo } from "./repo";

export const MasterSahamService = {
  createSaham(userId: number, data: z.infer<typeof createSahamSchema>) {
    return MasterSahamRepo.create(userId, data);
  },

  getLatestSaham() {
    return MasterSahamRepo.getLatest().andThen((data) => {
      if (!data) {
        return errAsync({
          code: "SAHAM_NOT_FOUND",
          message: "Data saham belum tersedia",
        } as const);
      }
      return okAsync(data);
    });
  },

  getPaginatedSaham(query: z.infer<typeof sahamQuerySchema>) {
    return MasterSahamRepo.getPaginated(query);
  },
};
