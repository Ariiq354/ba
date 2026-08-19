import { Effect } from "effect";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);

  return await SimpananService.deletePendingMutasi(id, user.id).pipe(
    Effect.catchTags({
      UnauthorizedMutasiAccessError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data mutasi tidak ditemukan",
          }),
        ),
      MutasiAlreadyProcessedError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Transaksi yang sudah diproses (approved/rejected) tidak dapat dihapus",
          }),
        ),
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data mutasi tidak ditemukan",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menghapus mutasi pending",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
