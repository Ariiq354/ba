import { Effect } from "effect";
import { createUserProfileSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createUserProfileSchema);

  return await UserService.updateProfile(user, body).pipe(
    Effect.catchTags({
      ProfileImageRequiredError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Foto profil baru wajib diisi untuk tindakan update",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal memperbarui data profil pengguna",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
