import { eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { files } from "~~/server/database/schema/files";
import { DatabaseError } from "~~/server/utils/error";

export const FilesRepo = {
  createPendingFile: Effect.fn("FilesRepo.createPendingFile")(
    (data: { publicId: string; filename: string; mimeType: string; size: number }) =>
      Effect.tryPromise({
        try: async () => {
          await db.insert(files).values({
            publicId: data.publicId,
            filename: data.filename,
            mimeType: data.mimeType,
            size: data.size,
            status: "pending",
          });
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  promoteFile: Effect.fn("FilesRepo.promoteFile")((publicId: string) =>
    Effect.tryPromise({
      try: async () => {
        await db
          .update(files)
          .set({ status: "success" })
          .where(eq(files.publicId, publicId));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getPendingFiles: Effect.fn("FilesRepo.getPendingFiles")(() =>
    Effect.tryPromise({
      try: async () => {
        return await db
          .select()
          .from(files)
          .where(eq(files.status, "pending"));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  deleteFilesByPublicIds: Effect.fn("FilesRepo.deleteFilesByPublicIds")((publicIds: string[]) =>
    Effect.tryPromise({
      try: async () => {
        if (publicIds.length === 0)
          return;
        await db.delete(files).where(inArray(files.publicId, publicIds));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
