import { Effect } from "effect";
import { rejectMutasiSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);
  const body = await readValidatedBodySafe(event, rejectMutasiSchema);

  return await SimpananService.rejectMutasi(id, adminUser.id, body).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data mutasi simpanan tidak ditemukan",
          }),
        ),
      MutasiAlreadyProcessedError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Transaksi ini sudah diproses sebelumnya",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menolak mutasi",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
