import { Effect } from "effect";
import { createPenarikanSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createPenarikanSchema);

  return await SimpananService.createPenarikan(user.id, body).pipe(
    Effect.catchTags({
      InsufficientEffectiveBalanceError: err =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: `Saldo efektif tidak mencukupi untuk penarikan sebesar Rp ${err.required.toLocaleString("id-ID")}. Saldo Efektif: Rp ${err.effectiveSaldo.toLocaleString("id-ID")}`,
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal membuat pengajuan penarikan",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
