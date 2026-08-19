import { Effect } from "effect";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { paginationSchema } from "~~/server/utils/schema";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, paginationSchema);

  return await MasterMarginService.getPaginatedMargin(query).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data margin",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
