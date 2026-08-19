import { Effect } from "effect";
import { createError, getHeader } from "h3";
import { FilesService } from "~~/server/modules/files/service";
import { env } from "~~/shared/env";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Secret cron tidak valid atau tidak disertakan",
    });
  }

  return await FilesService.cleanupPendingFiles().pipe(
    Effect.catchTags({
      StorageError: (err) => {
        console.error("Storage error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Storage Error",
            message: "Gagal menghapus file dari storage",
          }),
        );
      },
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal melakukan pembersihan file",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
