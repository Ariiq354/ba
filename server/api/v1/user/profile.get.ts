import { Effect } from "effect";
import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);

  return await UserService.getProfile(user.id).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data profil pengguna tidak ditemukan",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengambil data profil pengguna",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
