import { Effect } from "effect";
import { verifyUserSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, verifyUserSchema);

  return await UserService.verifyUser(body.userId).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Pengguna tidak ditemukan",
          }),
        ),
      KelompokNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Kelompok pengguna tidak ditemukan",
          }),
        ),
      UserAlreadyVerifiedError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Akun pengguna sudah terverifikasi sebelumnya",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal memverifikasi akun pengguna",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
