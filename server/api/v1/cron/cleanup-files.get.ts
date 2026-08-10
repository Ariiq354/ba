import { createError, getHeader } from "h3";
import { FilesService } from "~~/server/modules/files/service";
import { env } from "~~/shared/env";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  return await FilesService.cleanupPendingFiles().match(
    data => data,
    (err) => {
      switch (err.code) {
        case "DATABASE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "Database Error",
          });

        case "S3_DELETE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "S3 delete error",
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
