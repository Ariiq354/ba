import type { CreateMarginInput, MarginQueryInput, UpdateMarginInput } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterMarginRepo } from "./repo";

export const MasterMarginService = {
  createMargin(data: CreateMarginInput) {
    return MasterMarginRepo.create(data);
  },

  getMarginById(id: number) {
    return MasterMarginRepo.getById(id).andThen((data) => {
      if (!data) {
        return errAsync({
          code: "MARGIN_NOT_FOUND",
          message: "Data margin tidak ditemukan",
        } as const);
      }
      return okAsync(data);
    });
  },

  getPaginatedMargin(query: MarginQueryInput) {
    return MasterMarginRepo.getPaginated(query);
  },

  updateMargin(id: number, data: UpdateMarginInput) {
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

  deleteMargin(id: number) {
    return MasterMarginRepo.delete(id).andThen((deleted) => {
      if (!deleted) {
        return errAsync({
          code: "MARGIN_NOT_FOUND",
          message: "Data margin tidak ditemukan",
        } as const);
      }
      return okAsync(deleted);
    });
  },
};
