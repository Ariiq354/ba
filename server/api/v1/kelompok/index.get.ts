import { Effect } from "effect";
import { KelompokService } from "~~/server/modules/kelompok/service";

export default defineEventHandler(async () => {
  return await KelompokService.getOptionsKelompok().pipe(
    Effect.catchTags({
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data opsi kelompok",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
