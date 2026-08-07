import { defineRelations } from "drizzle-orm";
import * as authSchema from "./schema/auth";
import * as filesSchema from "./schema/files";
import * as kelompokSchema from "./schema/kelompok";
import * as wilayahSchema from "./schema/wilayah";

export const relations = defineRelations({
  ...authSchema,
  ...filesSchema,
  ...kelompokSchema,
  ...wilayahSchema,
}, r => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  provinsi: {
    kota: r.many.kota({
      from: r.provinsi.id,
      to: r.kota.idProvinsi,
    }),
  },
  kota: {
    provinsi: r.one.provinsi({
      from: r.kota.idProvinsi,
      to: r.provinsi.id,
    }),
    kecamatan: r.many.kecamatan({
      from: r.kota.id,
      to: r.kecamatan.idKota,
    }),
  },
  kecamatan: {
    kota: r.one.kota({
      from: r.kecamatan.idKota,
      to: r.kota.id,
    }),
    kelurahan: r.many.kelurahan({
      from: r.kecamatan.id,
      to: r.kelurahan.idKecamatan,
    }),
  },
  kelurahan: {
    kecamatan: r.one.kecamatan({
      from: r.kelurahan.idKecamatan,
      to: r.kecamatan.id,
    }),
  },
}));
