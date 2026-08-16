import { presignedUploadSchema } from "~~/server/modules/files/model";
import { FilesService } from "~~/server/modules/files/service";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBodySafe(event, presignedUploadSchema);
  return await FilesService.generatePresignedUpload(body);
});
