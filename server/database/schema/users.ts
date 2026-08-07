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
  idProvinsi: text().references(() => provinsi.id),
  idKota: text().references(() => kota.id),
  idKecamatan: text().references(() => kecamatan.id),
  idKelurahan: text().references(() => kelurahan.id),
});
