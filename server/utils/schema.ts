import { Buffer } from "node:buffer";
import { z } from "zod";

const multipartFileSchema = z.object({
  name: z.string().optional(),
  filename: z.string().optional(),
  type: z.string().optional(),
  data: z.instanceof(Buffer),
});

export type MultipartFile = z.infer<typeof multipartFileSchema>;

interface MultipartFilesOptions {
  minCount?: number;
  maxCount?: number;
  minSize?: number;
  maxSize?: number;
  fileTypes?: string[];
}

interface MultipartFileOptions {
  minSize?: number;
  maxSize?: number;
  fileTypes?: string[];
}

export function multipartFiles({
  minCount,
  maxCount,
  minSize,
  maxSize,
  fileTypes,
}: MultipartFilesOptions = {}) {
  const fileSchema = multipartFileSchema.superRefine(
    (file: MultipartFile, ctx) => {
      if (
        minSize !== undefined
        && file.data.length < minSize
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be at least ${minSize} bytes`,
        });
      }

      if (
        maxSize !== undefined
        && file.data.length > maxSize
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be at most ${maxSize} bytes`,
        });
      }

      if (
        fileTypes?.length
        && (!file.type || !fileTypes.includes(file.type))
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be one of: ${fileTypes.join(", ")}`,
        });
      }
    },
  );

  return z.preprocess(
    (value) => {
      if (value == null) {
        return [];
      }

      return Array.isArray(value)
        ? value
        : [value];
    },
    z.array(fileSchema).superRefine((files, ctx) => {
      if (
        minCount !== undefined
        && files.length < minCount
      ) {
        ctx.addIssue({
          code: "too_small",
          minimum: minCount,
          inclusive: true,
          origin: "array",
          message: `Minimum ${minCount} file(s) required`,
        });
      }

      if (
        maxCount !== undefined
        && files.length > maxCount
      ) {
        ctx.addIssue({
          code: "too_big",
          maximum: maxCount,
          inclusive: true,
          origin: "array",
          message: `Maximum ${maxCount} file(s) allowed`,
        });
      }
    }),
  );
}

export function multipartFile({
  minSize,
  maxSize,
  fileTypes,
}: MultipartFileOptions = {}) {
  const fileSchema = multipartFileSchema.superRefine(
    (file, ctx) => {
      if (
        minSize !== undefined
        && file.data.length < minSize
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be at least ${minSize} bytes`,
        });
      }

      if (
        maxSize !== undefined
        && file.data.length > maxSize
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be at most ${maxSize} bytes`,
        });
      }

      if (
        fileTypes?.length
        && (!file.type || !fileTypes.includes(file.type))
      ) {
        ctx.addIssue({
          code: "custom",
          message: `File "${file.filename ?? "unknown"}" must be one of: ${fileTypes.join(", ")}`,
        });
      }
    },
  );

  return z.preprocess(
    (value) => {
      if (value == null) {
        return undefined;
      }

      return Array.isArray(value)
        ? value[0]
        : value;
    },
    fileSchema,
  );
}

export const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export type PaginationSchema = z.infer<typeof paginationSchema>;

export const paginationSearchSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
});

export type PaginationSearchSchema = z.infer<typeof paginationSearchSchema>;

export const deleteSchema = z.object({
  ids: z.array(z.number()).default([]),
});

export type DeleteSchema = z.infer<typeof deleteSchema>;

export const idParamsSchema = z.object({
  id: z.coerce.number(),
});
