import { z } from "zod";

export const presignedUploadSchema = z.object({
  dir: z.string(),
  filename: z.string(),
  filesize: z.number(),
  fileType: z.string(),
});
export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
