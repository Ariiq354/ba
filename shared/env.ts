import process from "node:process";
import { z } from "zod";

const EnvZodSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_ACCESS_ID: z.string().min(1),
  CLOUDFLARE_SECRET_ID: z.string().min(1),
  CLOUDFLARE_BUCKET: z.string().min(1),
});

const parsedEnv = EnvZodSchema.safeParse(process.env);

if (!parsedEnv.success) {
  let message = "Missing required values in .env:\n";

  parsedEnv.error.issues.forEach((issue) => {
    message += `${String(issue.path.join("."))}: ${issue.message}\n`;
  });

  throw new Error(message);
}

export const env = parsedEnv.data;
