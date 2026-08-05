import { date, integer, snakeCase, text, timestamp } from "drizzle-orm/pg-core";
import { akun } from "./akun";
import { user } from "./auth";

export const jurnal = snakeCase.table("jurnal", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  kodeTransaksi: text().notNull().unique(),
  tanggalTransaksi: date().notNull(),
  idUser: integer().notNull().references(() => user.id),
  kodeAkun: text().notNull().references(() => akun.kodeAkun),
  nilaiTransaksi: integer().notNull(),
  debit: integer().notNull(),
  kredit: integer().notNull(),
  keterangan: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
