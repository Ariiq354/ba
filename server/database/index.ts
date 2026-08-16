import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../../shared/env";
import { relations } from "./relations";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
  },
  relations,
});

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbClient = typeof db | Tx;
