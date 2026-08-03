import { defineConfig } from "drizzle-kit";
import { env } from "./shared/env";

export default defineConfig({
  schema: "./server/database/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  casing: "snake_case",
});
