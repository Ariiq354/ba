import { Effect } from "effect";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);

  return await SimpananService.approveMutasi(id, adminUser.id).pipe(
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
      InsufficientEffectiveBalanceError: err =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: `Saldo efektif tidak mencukupi untuk approval penarikan ini. Diperlukan: Rp ${err.required.toLocaleString("id-ID")}, Efektif: Rp ${err.effectiveSaldo.toLocaleString("id-ID")}`,
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menyetujui mutasi",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
