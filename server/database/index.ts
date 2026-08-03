import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../../shared/env";
import { relations } from "./relations";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
  },
  relations,
});
