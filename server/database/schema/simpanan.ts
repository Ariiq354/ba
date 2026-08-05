import { date, integer, pgEnum, snakeCase, text, timestamp } from "drizzle-orm/pg-core";
import { akun } from "./akun";
import { user } from "./auth";
import { createdUpdated } from "./common";

export const jenisTransaksiEnum = pgEnum("jenis_transaksi", ["setoran", "penarikan"]);
export const approvedStatusEnum = pgEnum("approved_status", ["pending", "approved", "rejected"]);
export const jenisPemindahbukuanEnum = pgEnum("jenis_pemindahbukuan", ["saham_ke_saham", "tabungan_ke_tabungan", "tabungan_ke_saham"]);

export const saldoSimpanan = snakeCase.table("saldo_simpanan", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  idUser: integer().notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  saldoTabungan: integer().notNull().default(0),
  saldoSaham: integer().notNull().default(0),
  ...createdUpdated,
});

export const mutasiSimpanan = snakeCase.table("mutasi_simpanan", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  kodeTransaksi: text().notNull().unique(),
  idUser: integer().notNull().references(() => user.id),
  kodeAkun: text().notNull().references(() => akun.kodeAkun),
  jenisTransaksi: jenisTransaksiEnum().notNull(),
  nilaiTransaksi: integer().notNull(),
  saldoSetelahTransaksi: integer().notNull(),
  tanggalTransaksi: date().notNull(),
  statusApproved: approvedStatusEnum().notNull().default("pending"),
  alasanPenolakan: text(),
  keterangan: text(),
  createdBy: integer().notNull().references(() => user.id),
  approvedBy: integer().references(() => user.id),
  approvedAt: timestamp({ withTimezone: true }),
  ...createdUpdated,
});

export const pemindahbukuan = snakeCase.table("pemindahbukuan", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  kodeTransaksi: text().notNull().unique(),
  idUserSumber: integer().notNull().references(() => user.id),
  kodeAkunSumber: text().notNull().references(() => akun.kodeAkun),
  idUserTujuan: integer().notNull().references(() => user.id),
  kodeAkunTujuan: text().notNull().references(() => akun.kodeAkun),
  nominal: integer().notNull(),
  tipePemindahbukuan: jenisPemindahbukuanEnum().notNull(),
  tanggalTransaksi: date().notNull(),
  statusApproved: approvedStatusEnum().notNull().default("pending"),
  alasanPenolakan: text(),
  keterangan: text(),
  createdBy: integer().notNull().references(() => user.id),
  approvedBy: integer().references(() => user.id),
  approvedAt: timestamp({ withTimezone: true }),
  ...createdUpdated,
});
