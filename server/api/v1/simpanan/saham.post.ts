import { Effect } from "effect";
import { createSetorSahamSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createSetorSahamSchema);

  return await SimpananService.createSetorSaham(user.id, body).pipe(
    Effect.catchTags({
      HargaSahamNotConfiguredError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Master harga saham belum diatur oleh administrator",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal membuat pengajuan setor saham",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
