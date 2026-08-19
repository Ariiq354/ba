import type { PresignedUploadInput } from "./model";
import { Effect } from "effect";
import { deleteFiles, getUploadUrl } from "~~/server/utils/files";
import { UPLOAD_CONFIG } from "./config";
import {
  FileTooLargeError,
  InvalidUploadDirectoryError,
  UnsupportedFileTypeError,
} from "./errors";
import { FilesRepo } from "./repo";

export const FilesService = {
  generatePresignedUpload: Effect.fn("FilesService.generatePresignedUpload")(function* (
    input: PresignedUploadInput,
  ) {
    const dirConfig = UPLOAD_CONFIG[input.dir];

    if (!dirConfig) {
      return yield* new InvalidUploadDirectoryError();
    }

    if (input.filesize > dirConfig.maxSize) {
      return yield* new FileTooLargeError({
        maxSizeMb: dirConfig.maxSize / 1024 / 1024,
      });
    }

    if (!dirConfig.allowedMimeTypes.includes(input.fileType)) {
      return yield* new UnsupportedFileTypeError();
    }

    const { uploadUrl, key } = yield* getUploadUrl(
      input.dir,
      input.filename,
      input.filesize,
      input.fileType,
    );

    yield* FilesRepo.createPendingFile({
      publicId: key,
      filename: input.filename,
      mimeType: input.fileType,
      size: input.filesize,
    });

    return {
      uploadUrl,
      key,
    };
  }),

  cleanupPendingFiles: Effect.fn("FilesService.cleanupPendingFiles")(function* () {
    const pendingFiles = yield* FilesRepo.getPendingFiles();

    if (!pendingFiles || pendingFiles.length === 0) {
      return { deletedCount: 0 };
    }

    const deletedPublicIds = pendingFiles.map(file => file.publicId);

    yield* deleteFiles(deletedPublicIds).pipe(
      Effect.catch((err) => {
        console.error("Failed to delete files from S3:", err.error);
        return Effect.void;
      }),
    );

    yield* FilesRepo.deleteFilesByPublicIds(deletedPublicIds);

    return {
      deletedCount: deletedPublicIds.length,
    };
  }),
};
