import type { CreateJurnalSchema, GetJurnalQuerySchema } from "./model";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { DatabaseError, ItemNotFoundError, ItemsNotFoundError } from "~~/server/utils/error";
import { JurnalRepo } from "./repo";

export const JurnalService = {
  getPaginatedJurnal: Effect.fn("JurnalService.getPaginatedJurnal")(function* (query: GetJurnalQuerySchema) {
    return yield* JurnalRepo.findAll(query);
  }),

  getJurnalById: Effect.fn("JurnalService.getJurnalById")(function* (id: number) {
    const item = yield* JurnalRepo.findById(id);
    if (!item) {
      return yield* new ItemNotFoundError({ id });
    }
    return item;
  }),

  createJurnal: Effect.fn("JurnalService.createJurnal")(function* (data: CreateJurnalSchema, userId: number) {
    const autoCode = yield* JurnalRepo.generateNextKodeTransaksi(data.tanggalTransaksi);

    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          const header = await Effect.runPromise(
            JurnalRepo.createHeader(
              {
                kodeTransaksi: autoCode,
                tanggalTransaksi: data.tanggalTransaksi,
                keterangan: data.keterangan || null,
                userId,
              },
              tx,
            ),
          );

          const detailValues = data.details.map(d => ({
            jurnalId: header.id,
            akunId: d.akunId,
            debit: Math.round(d.debit || 0),
            kredit: Math.round(d.kredit || 0),
          }));

          const details = await Effect.runPromise(JurnalRepo.insertDetails(detailValues, tx));

          return { header, details };
        });
      },
      catch: error => new DatabaseError({ error }),
    });
  }),

  deleteJurnal: Effect.fn("JurnalService.deleteJurnal")(function* (id: number) {
    const returning = yield* JurnalRepo.delete(id);
    if (returning.length === 0) {
      return yield* new ItemNotFoundError({ id });
    }
    return { success: true };
  }),

  deleteBulkJurnal: Effect.fn("JurnalService.deleteBulkJurnal")(function* (ids: number[]) {
    const returning = yield* JurnalRepo.deleteBulk(ids);
    if (returning.length === 0) {
      return yield* new ItemsNotFoundError({ ids });
    }
    return { success: true };
  }),
};
