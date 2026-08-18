import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { Effect } from "effect";
import { AkunNotFoundError, DuplicateKodeAkunError } from "./errors";
import { MasterAkunRepo } from "./repo";

export const MasterAkunService = {
  createAkun: Effect.fn("MasterAkunService.createAkun")(function* (data: CreateAkunSchema) {
    const existing = yield* MasterAkunRepo.findByKodeAkun(data.kodeAkun);
    if (existing) {
      return yield* new DuplicateKodeAkunError({ kodeAkun: data.kodeAkun });
    }

    return yield* MasterAkunRepo.create(data);
  }),

  getPaginatedAkun: Effect.fn("MasterAkunService.getPaginatedAkun")(function* (query: GetAkunQuerySchema) {
    return yield* MasterAkunRepo.getPaginated(query);
  }),

  updateAkun: Effect.fn("MasterAkunService.updateAkun")(function* (id: number, data: UpdateAkunSchema) {
    const existing = yield* MasterAkunRepo.findById(id);
    if (!existing) {
      return yield* new AkunNotFoundError({ id });
    }

    if (data.kodeAkun && data.kodeAkun !== existing.kodeAkun) {
      const duplicate = yield* MasterAkunRepo.findByKodeAkun(data.kodeAkun);
      if (duplicate) {
        return yield* new DuplicateKodeAkunError({ kodeAkun: data.kodeAkun });
      }
    }

    const updated = yield* MasterAkunRepo.update(id, data);
    if (!updated) {
      return yield* new AkunNotFoundError({ id });
    }

    return updated;
  }),

  deleteAkun: Effect.fn("MasterAkunService.deleteAkun")(function* (ids: number[]) {
    return yield* MasterAkunRepo.deleteBulk(ids);
  }),
};
