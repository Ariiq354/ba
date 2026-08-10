import type { PresignedUploadInput } from "./model";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { deleteFile, getUploadUrl } from "~~/server/utils/files";
import { UPLOAD_CONFIG } from "./config";
import { FilesRepo } from "./repo";

export const FilesService = {
  generatePresignedUpload(
    input: PresignedUploadInput,
  ) {
    const dirConfig = UPLOAD_CONFIG[input.dir];

    if (!dirConfig) {
      return errAsync({
        code: "INVALID_DIR",
      } as const);
    }

    if (input.filesize > dirConfig.maxSize) {
      return errAsync({
        code: "FILE_TOO_LARGE",
      } as const);
    }

    if (!dirConfig.allowedMimeTypes.includes(input.fileType)) {
      return errAsync({
        code: "INVALID_FILE_TYPE",
      } as const);
    }

    return ResultAsync.fromPromise(
      getUploadUrl(input.dir, input.filename, input.filesize, input.fileType),
      cause => ({ code: "S3_ERROR", cause } as const),
    ).andThen(({ uploadUrl, key }) => {
      return FilesRepo.createPendingFile({
        publicId: key,
        filename: input.filename,
        mimeType: input.fileType,
        size: input.filesize,
      }).map(() => ({
        uploadUrl,
        key,
      }));
    });
  },

  cleanupPendingFiles() {
    return FilesRepo.getPendingFiles().andThen((pendingFiles) => {
      if (pendingFiles.length === 0) {
        return okAsync({ deletedCount: 0 });
      }

      return ResultAsync.fromPromise(
        (async () => {
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
          return deletedPublicIds;
        })(),
        cause => ({ code: "S3_DELETE_ERROR", cause } as const),
      ).andThen((deletedPublicIds) => {
        return FilesRepo.deleteFilesByPublicIds(deletedPublicIds).map(() => ({
          deletedCount: deletedPublicIds.length,
        }));
      });
    });
  },
};
