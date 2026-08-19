import { Effect } from "effect";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { deleteSchema } from "~~/server/utils/schema";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { ids } = await readValidatedBodySafe(event, deleteSchema);

  return await MasterMarginService.deleteMargin(ids).pipe(
    Effect.catchTags({
      ItemsNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data margin yang akan dihapus tidak ditemukan",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal menghapus data margin",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
