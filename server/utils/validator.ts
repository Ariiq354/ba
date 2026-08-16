import type { H3Event } from "h3";
import type { z } from "zod";
import { prettifyError } from "zod";

export async function readValidatedMultipart<T>(
  event: H3Event,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const form = await readMultipartFormData(event);

  if (!form) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      message: "Form data tidak ditemukan",
    });
  }

  const data: Record<string, unknown> = {};

  for (const item of form) {
    if (!item.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Field name pada multipart form wajib diisi",
      });
    }

    const value = item.filename
      ? item
      : item.data.toString();

    const existing = data[item.name];

    if (existing === undefined) {
      data[item.name] = value;
    }
    else if (Array.isArray(existing)) {
      existing.push(value);
    }
    else {
      data[item.name] = [existing, value];
    }
  }

  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      message: prettifyError(parsed.error),
      data: parsed.error.issues,
    });
  }

  return parsed.data;
}

export async function getValidatedQuerySafe<T>(
  event: H3Event,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const result = await getValidatedQuery(event, schema.safeParse);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      message: prettifyError(result.error),
      data: result.error.issues,
    });
  }

  return result.data;
}

export async function readValidatedBodySafe<T>(
  event: H3Event,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const result = await readValidatedBody(event, schema.safeParse);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      message: prettifyError(result.error),
      data: result.error.issues,
    });
  }

  return result.data;
}

export async function getValidatedRouterParamsSafe<T>(
  event: H3Event,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const result = await getValidatedRouterParams(event, schema.safeParse);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      message: prettifyError(result.error),
      data: result.error.issues,
    });
  }

  return result.data;
}
