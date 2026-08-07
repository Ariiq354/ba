import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { files } from "~~/server/database/schema/files";

export const FilesRepo = {
  createPendingFile(data: { publicId: string; filename: string; mimeType: string; size: number }) {
    return ResultAsync.fromPromise(
      db
        .insert(files)
        .values({
          publicId: data.publicId,
          filename: data.filename,
          mimeType: data.mimeType,
          size: data.size,
          status: "pending",
        }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
