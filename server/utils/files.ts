import path from "node:path";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Effect } from "effect";
import { env } from "~~/shared/env";
import { StorageError } from "./error";

const DIR_REGEX = /\/+$/;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ID,
  },
});

export const getUploadUrl = Effect.fn("FilesUtils.getUploadUrl")(
  (
    dir: string,
    filename: string,
    filesize: number,
    fileType: string,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const ext = filename.includes(".")
          ? filename.substring(filename.lastIndexOf("."))
          : "";

        const storedName = `${crypto.randomUUID()}${ext}`;
        const key = `${dir.replace(DIR_REGEX, "")}/${storedName}`;

        const uploadUrl = await getSignedUrl(
          S3,
          new PutObjectCommand({
            Bucket: env.CLOUDFLARE_BUCKET,
            Key: key,
            ContentType: fileType,
            ContentLength: filesize,
          }),
        );

        return { uploadUrl, key };
      },
      catch: error => new StorageError({ error }),
    }),
);

export const deleteFile = Effect.fn("FilesUtils.deleteFile")((key: string) =>
  Effect.tryPromise({
    try: async () => {
      await S3.send(
        new DeleteObjectCommand({
          Bucket: env.CLOUDFLARE_BUCKET,
          Key: key,
        }),
      );
    },
    catch: error => new StorageError({ error }),
  }),
);

export const deleteFiles = Effect.fn("FilesUtils.deleteFiles")(
  (keys: string[]) =>
    Effect.tryPromise({
      try: async () => {
        if (keys.length === 0)
          return;
        await S3.send(
          new DeleteObjectsCommand({
            Bucket: env.CLOUDFLARE_BUCKET,
            Delete: {
              Objects: keys.map(Key => ({ Key })),
            },
          }),
        );
      },
      catch: error => new StorageError({ error }),
    }),
);

export function getFileExtension(filename: string): string {
  return path.extname(filename).slice(1);
}
