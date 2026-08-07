export interface FileDirConfig {
  maxSize: number; // Bytes
  allowedMimeTypes: string[];
}

export const UPLOAD_CONFIG: Record<string, FileDirConfig> = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  },
};
