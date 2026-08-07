import { createError } from "h3";
import { presignedUploadSchema } from "~~/server/modules/files/model";
import { FilesService } from "~~/server/modules/files/service";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBodySafe(event, presignedUploadSchema);

  return await FilesService.generatePresignedUpload(body).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "INVALID_DIR":
          throw createError({
            statusCode: 400,
            statusMessage: "Invalid directory",
          });

        case "FILE_TOO_LARGE":
          throw createError({
            statusCode: 400,
            statusMessage: "File too large",
          });

        case "INVALID_FILE_TYPE":
          throw createError({
            statusCode: 400,
            statusMessage: "Invalid file type",
          });

        case "S3_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "S3 error",
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
