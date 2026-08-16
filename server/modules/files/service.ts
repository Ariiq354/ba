import type { PresignedUploadInput } from "./model";
import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { deleteFile, getUploadUrl } from "~~/server/utils/files";
import { UPLOAD_CONFIG } from "./config";
import { FilesRepo } from "./repo";

export const FilesService = {
  async generatePresignedUpload(input: PresignedUploadInput) {
    const dirConfig = UPLOAD_CONFIG[input.dir];

    if (!dirConfig) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Direktori unggahan tidak valid",
      });
    }

    if (input.filesize > dirConfig.maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: `Ukuran file melebihi batas maksimum (${dirConfig.maxSize / 1024 / 1024}MB)`,
      });
    }

    if (!dirConfig.allowedMimeTypes.includes(input.fileType)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Tipe file tidak didukung",
      });
    }

    const [s3Err, uploadData] = await catchError(
      getUploadUrl(input.dir, input.filename, input.filesize, input.fileType),
    );
    if (s3Err || !uploadData) {
      console.error("Gagal mendapatkan presigned URL dari S3:", s3Err);
      throw createError({
        statusCode: 500,
        statusMessage: "Storage Error",
        message: "Gagal membuat URL unggahan file",
      });
    }

    const { uploadUrl, key } = uploadData;

    const [dbErr] = await catchError(
      FilesRepo.createPendingFile({
        publicId: key,
        filename: input.filename,
        mimeType: input.fileType,
        size: input.filesize,
      }),
    );
    if (dbErr) {
      console.error("Gagal menyimpan data pending file ke DB:", dbErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mencatat data file ke database",
      });
    }

    return {
      uploadUrl,
      key,
    };
  },

  async cleanupPendingFiles() {
    const [findErr, pendingFiles] = await catchError(FilesRepo.getPendingFiles());
    if (findErr) {
      console.error("Gagal mengambil data pending files:", findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data pending files",
      });
    }

    if (!pendingFiles || pendingFiles.length === 0) {
      return { deletedCount: 0 };
    }

    const deletedPublicIds: string[] = [];
    for (const file of pendingFiles) {
      try {
        await deleteFile(file.publicId);
      }
      catch (err) {
        console.error(`Failed to delete file from S3: ${file.publicId}`, err);
      }
      deletedPublicIds.push(file.publicId);
    }

    const [deleteErr] = await catchError(FilesRepo.deleteFilesByPublicIds(deletedPublicIds));
    if (deleteErr) {
      console.error("Gagal menghapus file dari database:", deleteErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menghapus catatan file",
      });
    }

    return {
      deletedCount: deletedPublicIds.length,
    };
  },
};
