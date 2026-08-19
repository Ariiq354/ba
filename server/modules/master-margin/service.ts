import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { Effect } from "effect";
import { ItemNotFoundError, ItemsNotFoundError } from "~~/server/utils/error";
import { MasterMarginRepo } from "./repo";

export const MasterMarginService = {
  createMargin: Effect.fn("MasterMarginService.createMargin")(function* (data: CreateMarginSchema) {
    return yield* MasterMarginRepo.create(data);
  }),

  getPaginatedMargin: Effect.fn("MasterMarginService.getPaginatedMargin")(function* (query: PaginationSchema) {
    return yield* MasterMarginRepo.findAll(query);
  }),

  updateMargin: Effect.fn("MasterMarginService.updateMargin")(function* (id: number, data: UpdateMarginSchema) {
    const returning = yield* MasterMarginRepo.update(id, data);
    if (returning.length === 0) {
      return yield* new ItemNotFoundError({ id });
    }
  }),

  deleteMargin: Effect.fn("MasterMarginService.deleteMargin")(function* (ids: number[]) {
    const returning = yield* MasterMarginRepo.deleteBulk(ids);
    if (returning.length === 0) {
      return yield* new ItemsNotFoundError({ ids });
    }
  }),
};
