import { Effect } from "effect";
import { getMutasiQuerySchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const rawQuery = await getValidatedQuerySafe(event, getMutasiQuerySchema);

  // Force user filter for non-admin requests
  const query = {
    ...rawQuery,
    userId: user.role === "admin" ? (rawQuery.userId ?? user.id) : user.id,
  };

  return await SimpananService.getPaginatedMutasi(query).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data mutasi simpanan",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
