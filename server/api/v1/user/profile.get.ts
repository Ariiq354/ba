import { createError } from "h3";
import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);

  return await UserService.getProfile(user.id).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "USER_NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });

        case "DATABASE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "Database Error",
          });

        default: {
          err satisfies never;
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
