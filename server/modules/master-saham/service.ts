import type { CreateSahamInput, SahamQueryInput } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterSahamRepo } from "./repo";

export const MasterSahamService = {
  createSaham(userId: number, data: CreateSahamInput) {
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

  getPaginatedSaham(query: SahamQueryInput) {
    return MasterSahamRepo.getPaginated(query);
  },
};
