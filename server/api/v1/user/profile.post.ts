import { createError } from "h3";
import { createUserProfileSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createUserProfileSchema);

  return await UserService.updateProfile(user, body).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "IMAGE_REQUIRED":
          throw createError({
            statusCode: 400,
            statusMessage: err.message,
          });

        case "S3_DELETE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "S3 delete error",
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
