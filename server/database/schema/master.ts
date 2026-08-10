import { bigint, integer, pgEnum, snakeCase, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdUpdated } from "./common";

export const jaminanEnum = pgEnum("jaminan", ["TIDAK_ADA", "ADA"]);

export const saham = snakeCase.table("saham", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  hargaNominal: bigint({ mode: "number" }).notNull(),
  hargaJual: bigint({ mode: "number" }).notNull(),
  updatedBy: integer().notNull().references(() => user.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const margin = snakeCase.table("margin", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  minNominal: bigint({ mode: "number" }).notNull(),
  maxNominal: bigint({ mode: "number" }).notNull(),
  persenMarginTahun: integer().notNull(),
  jaminan: jaminanEnum().notNull(),
  biayaAkad: bigint({ mode: "number" }).notNull(),
  ...createdUpdated,
});
