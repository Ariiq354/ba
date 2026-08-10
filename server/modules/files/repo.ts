import { eq, inArray } from "drizzle-orm";
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

  promoteFile(publicId: string) {
    return ResultAsync.fromPromise(
      db
        .update(files)
        .set({ status: "success" })
        .where(eq(files.publicId, publicId)),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getPendingFiles() {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(files)
        .where(eq(files.status, "pending")),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  deleteFilesByPublicIds(publicIds: string[]) {
    if (publicIds.length === 0) {
      return ResultAsync.fromPromise(
        Promise.resolve(),
        cause => ({ code: "DATABASE_ERROR", cause } as const),
      );
    }
    return ResultAsync.fromPromise(
      db
        .delete(files)
        .where(inArray(files.publicId, publicIds)),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
