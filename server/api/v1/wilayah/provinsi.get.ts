import { Effect } from "effect";
import { WilayahService } from "~~/server/modules/wilayah/service";

export default defineEventHandler(async () => {
  return await WilayahService.getProvinsi().pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data provinsi",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
