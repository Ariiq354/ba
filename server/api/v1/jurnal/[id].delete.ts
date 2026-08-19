import { Effect } from "effect";
import { JurnalService } from "~~/server/modules/jurnal/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);

  return await JurnalService.deleteJurnal(id).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Transaksi jurnal dengan ID ${id} tidak ditemukan`,
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menghapus data transaksi jurnal",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
