import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateSahamSchema } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterSahamRepo } from "./repo";

export const MasterSahamService = {
  createSaham(userId: number, data: CreateSahamSchema) {
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

  getPaginatedSaham(query: PaginationSchema) {
    return MasterSahamRepo.getPaginated(query);
  },
};
