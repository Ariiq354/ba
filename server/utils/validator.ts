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
      statusMessage: "Missing form data",
    });
  }

  const data: Record<string, unknown> = {};

  for (const item of form) {
    if (!item.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Multipart field name is required",
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
      statusMessage: "Invalid data",
      data: prettifyError(parsed.error),
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
      statusMessage: "Invalid query",
      data: prettifyError(result.error),
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
      statusMessage: "Invalid body",
      data: prettifyError(result.error),
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
      statusMessage: "Invalid params",
      data: prettifyError(result.error),
    });
  }

  return result.data;
}
