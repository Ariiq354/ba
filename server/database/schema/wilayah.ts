import { snakeCase, text } from "drizzle-orm/pg-core";

export const provinsi = snakeCase.table("provinsi", {
  id: text().primaryKey(),
  provinsi: text().notNull(),
});

export const kota = snakeCase.table("kota", {
  id: text().primaryKey(),
  idProvinsi: text().notNull().references(() => provinsi.id),
  kota: text().notNull(),
});

export const kecamatan = snakeCase.table("kecamatan", {
  id: text().primaryKey(),
  idKota: text().notNull().references(() => kota.id),
  kecamatan: text().notNull(),
});

export const kelurahan = snakeCase.table("kelurahan", {
  id: text().primaryKey(),
  idKecamatan: text().notNull().references(() => kecamatan.id),
  kelurahan: text().notNull(),
});
