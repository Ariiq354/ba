import { Effect } from "effect";
import { createJurnalSchema } from "~~/server/modules/jurnal/model";
import { JurnalService } from "~~/server/modules/jurnal/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const body = await readValidatedBodySafe(event, createJurnalSchema);

  return await JurnalService.createJurnal(body, adminUser.id).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menyimpan transaksi jurnal",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
