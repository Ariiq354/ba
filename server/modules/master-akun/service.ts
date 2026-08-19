import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { Effect } from "effect";
import { ItemNotFoundError, ItemsNotFoundError } from "~~/server/utils/error";
import { MasterAkunRepo } from "./repo";

export const MasterAkunService = {
  createAkun: Effect.fn("MasterAkunService.createAkun")(function* (data: CreateAkunSchema) {
    return yield* MasterAkunRepo.create(data);
  }),

  getPaginatedAkun: Effect.fn("MasterAkunService.getPaginatedAkun")(function* (query: GetAkunQuerySchema) {
    return yield* MasterAkunRepo.findAll(query);
  }),

  updateAkun: Effect.fn("MasterAkunService.updateAkun")(function* (id: number, data: UpdateAkunSchema) {
    const returning = yield* MasterAkunRepo.update(id, data);
    if (returning.length === 0) {
      return yield* new ItemNotFoundError({ id });
    }
  }),

  deleteAkun: Effect.fn("MasterAkunService.deleteAkun")(function* (ids: number[]) {
    const returning = yield* MasterAkunRepo.deleteBulk(ids);

    if (returning.length === 0) {
      return yield* new ItemsNotFoundError({ ids });
    }
  }),
};
