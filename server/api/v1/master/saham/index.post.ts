import { Effect } from "effect";
import { createSahamSchema } from "~~/server/modules/master-saham/model";
import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const body = await readValidatedBodySafe(event, createSahamSchema);

  return await MasterSahamService.createSaham(adminUser.id, body).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal membuat data master saham",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
