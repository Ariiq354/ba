import { Effect } from "effect";
import { setGroupPjSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, setGroupPjSchema);

  return await UserService.setUserPj(body.userId, body.isPj).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(
          createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Pengguna tidak ditemukan",
          }),
        ),
      AdminCannotBePjError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Pengguna dengan role Admin tidak dapat dijadikan PJ kelompok",
          }),
        ),
      UserUnverifiedError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Pengguna belum terverifikasi, tidak dapat dijadikan PJ kelompok",
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mengubah penanggung jawab kelompok",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
