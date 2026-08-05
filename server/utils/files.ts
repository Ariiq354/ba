import type { Buffer } from "node:buffer";
import path from "node:path";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "~~/shared/env";

const DIR_REGEX = /\/+$/;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ID,
  },
});

export async function uploadFile(
  dir: string,
  filename: string,
  data: Buffer,
  contentType: string,
) {
  const ext = filename.includes(".")
    ? filename.substring(filename.lastIndexOf("."))
    : "";

  const storedName = `${crypto.randomUUID()}${ext}`;
  const key = `${dir.replace(DIR_REGEX, "")}/${storedName}`;

  await S3.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );

  return {
    key,
    storedName,
  };
}

export async function deleteFile(
  key: string,
) {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
    }),
  );
}

export async function deleteFiles(
  keys: string[],
) {
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
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).slice(1);
}
