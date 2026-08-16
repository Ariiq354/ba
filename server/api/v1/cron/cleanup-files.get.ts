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

  return await FilesService.cleanupPendingFiles();
});
