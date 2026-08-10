import { createError } from "h3";
import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  adminGuard(event);

  return await MasterSahamService.getLatestSaham().match(
    data => data,
    (err) => {
      switch (err.code) {
        case "SAHAM_NOT_FOUND":
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
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
