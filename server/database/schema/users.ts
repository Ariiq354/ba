import { integer, snakeCase, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kecamatan, kelurahan, kota, provinsi } from "./wilayah";

export const userProfile = snakeCase.table("user_profile", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  idUser: integer()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  noAnggota: text().unique(),
  noHp: text(),
  nik: text(),
  namaBank: text(),
  noRekening: text(),
  pemilikRekening: text(),
  jalan: text(),
  provinsi: text().notNull().references(() => provinsi.id),
  kota: text().notNull().references(() => kota.id),
  kecamatan: text().notNull().references(() => kecamatan.id),
  kelurahan: text().notNull().references(() => kelurahan.id),
});
