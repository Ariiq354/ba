import type { PresignedUploadInput } from "./model";
import { errAsync, ResultAsync } from "neverthrow";
import { getUploadUrl } from "~~/server/utils/files";
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
};
