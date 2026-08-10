import type { z } from "zod";
import type { paginationSchema } from "~~/server/utils/schema";
import type { createMarginSchema, updateMarginSchema } from "./model";
import { errAsync, okAsync } from "neverthrow";
import { MasterMarginRepo } from "./repo";

export const MasterMarginService = {
  createMargin(data: z.infer<typeof createMarginSchema>) {
    return MasterMarginRepo.create(data);
  },

  getPaginatedMargin(query: z.infer<typeof paginationSchema>) {
    return MasterMarginRepo.getPaginated(query);
  },

  updateMargin(id: number, data: z.infer<typeof updateMarginSchema>) {
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
