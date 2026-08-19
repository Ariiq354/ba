import { Effect } from "effect";
import { presignedUploadSchema } from "~~/server/modules/files/model";
import { FilesService } from "~~/server/modules/files/service";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBodySafe(event, presignedUploadSchema);

  return await FilesService.generatePresignedUpload(body).pipe(
    Effect.catchTags({
      InvalidUploadDirectoryError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Direktori unggahan tidak valid",
          }),
        ),
      FileTooLargeError: err =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: `Ukuran file melebihi batas maksimum (${err.maxSizeMb}MB)`,
          }),
        ),
      UnsupportedFileTypeError: () =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Tipe file tidak didukung",
          }),
        ),
      StorageError: (err) => {
        console.error("Storage error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Storage Error",
            message: "Gagal membuat URL unggahan file",
          }),
        );
      },
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal mencatat data file ke database",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
