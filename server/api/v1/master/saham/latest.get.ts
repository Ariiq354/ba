import { Effect } from "effect";
import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  adminGuard(event);

  return await MasterSahamService.getLatestSaham().pipe(
    Effect.catchTags({
      HargaSahamNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data master harga saham belum tersedia",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data master saham",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
