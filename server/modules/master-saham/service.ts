import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateSahamSchema } from "./model";
import { Effect } from "effect";
import { HargaSahamNotFoundError } from "./errors";
import { MasterSahamRepo } from "./repo";

export const MasterSahamService = {
  createSaham: Effect.fn("MasterSahamService.createSaham")(function* (userId: number, data: CreateSahamSchema) {
    return yield* MasterSahamRepo.create(userId, data);
  }),

  getLatestSaham: Effect.fn("MasterSahamService.getLatestSaham")(function* () {
    const data = yield* MasterSahamRepo.getLatest();
    if (!data) {
      return yield* new HargaSahamNotFoundError();
    }
    return data;
  }),

  getPaginatedSaham: Effect.fn("MasterSahamService.getPaginatedSaham")(function* (query: PaginationSchema) {
    return yield* MasterSahamRepo.findAll(query);
  }),
};
