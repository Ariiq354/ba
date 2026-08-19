import { Effect } from "effect";
import { kotaQuerySchema } from "~~/server/modules/wilayah/model";
import { WilayahService } from "~~/server/modules/wilayah/service";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuerySafe(event, kotaQuerySchema);

  return await WilayahService.getKotaByProvinsiId(query.idProvinsi).pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data kota",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
