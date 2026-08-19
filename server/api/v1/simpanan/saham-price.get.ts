import { Effect } from "effect";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  authGuard(event);

  return await SimpananService.getLatestSahamPrice().pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data harga saham",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
