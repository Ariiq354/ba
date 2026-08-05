import { integer, snakeCase, text } from "drizzle-orm/pg-core";

export const kelompok = snakeCase.table("kelompok", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  kodeKelompok: text().notNull().unique(),
  namaKelompok: text().notNull(),
});
