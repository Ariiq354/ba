interface PresignedResponse {
  uploadUrl: string;
  key: string;
}

export async function uploadFile(
  file: File,
  options: { dir: string }
): Promise<string> {
  // 1. Dapatkan presigned upload URL & pending file ID dari server
  const presigned = await $fetch<PresignedResponse>("/api/v1/files/presigned", {
    method: "POST",
    body: {
      dir: options.dir,
      filename: file.name,
      filesize: file.size,
      fileType: file.type || "application/octet-stream",
    },
  });

  // 2. Upload file langsung ke presigned PUT URL (S3 / Cloudflare R2)
  await $fetch(presigned.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  return presigned.key;
}

// Alias untuk kompatibilitas jika masih ingin menggunakan nama useUploadFile
export const useUploadFile = uploadFile;

