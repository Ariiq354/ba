import { Effect } from "effect";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);

  return await SimpananService.getSaldo(user.id).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data saldo",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
