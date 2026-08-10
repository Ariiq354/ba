import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterMarginRepo } from "./repo";

export const MasterMarginService = {
  createMargin(data: CreateMarginSchema) {
    return MasterMarginRepo.create(data);
  },

  getPaginatedMargin(query: PaginationSchema) {
    return MasterMarginRepo.getPaginated(query);
  },

  updateMargin(id: number, data: UpdateMarginSchema) {
    return MasterMarginRepo.update(id, data).andThen((updated) => {
      if (!updated) {
        return errAsync({
          code: "MARGIN_NOT_FOUND",
          message: "Data margin tidak ditemukan",
        } as const);
      }
      return okAsync(updated);
    });
  },

  deleteMargin(ids: number[]) {
    return MasterMarginRepo.deleteBulk(ids);
  },
};
