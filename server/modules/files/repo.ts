import type { DbClient } from "~~/server/database";
import { eq, inArray } from "drizzle-orm";
import { db } from "~~/server/database";
import { files } from "~~/server/database/schema/files";

export const FilesRepo = {
  async createPendingFile(
    data: { publicId: string; filename: string; mimeType: string; size: number },
    client: DbClient = db,
  ) {
    return await client
      .insert(files)
      .values({
        publicId: data.publicId,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        status: "pending",
      });
  },

  async promoteFile(publicId: string, client: DbClient = db) {
    return await client
      .update(files)
      .set({ status: "success" })
      .where(eq(files.publicId, publicId));
  },

  async getPendingFiles(client: DbClient = db) {
    return await client
      .select()
      .from(files)
      .where(eq(files.status, "pending"));
  },

  async deleteFilesByPublicIds(publicIds: string[], client: DbClient = db) {
    if (publicIds.length === 0) {
      return;
    }
    return await client
      .delete(files)
      .where(inArray(files.publicId, publicIds));
  },
};
