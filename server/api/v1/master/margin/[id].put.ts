import { Effect } from "effect";
import { updateMarginSchema } from "~~/server/modules/master-margin/model";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);
  const body = await readValidatedBodySafe(event, updateMarginSchema);

  return await MasterMarginService.updateMargin(id, body).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Data margin dengan ID ${id} tidak ditemukan`,
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal memperbarui data margin",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
