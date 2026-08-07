import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";

export const WilayahRepo = {
  getProvinsi() {
    return ResultAsync.fromPromise(
      db.query.provinsi.findMany({
        orderBy: {
          provinsi: "asc",
        },
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getKotaByProvinsiId(idProvinsi: string) {
    return ResultAsync.fromPromise(
      db.query.kota.findMany({
        where: {
          idProvinsi,
        },
        orderBy: {
          kota: "asc",
        },
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getKecamatanByKotaId(idKota: string) {
    return ResultAsync.fromPromise(
      db.query.kecamatan.findMany({
        where: {
          idKota,
        },
        orderBy: {
          kecamatan: "asc",
        },
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getKelurahanByKecamatanId(idKecamatan: string) {
    return ResultAsync.fromPromise(
      db.query.kelurahan.findMany({
        where: {
          idKecamatan,
        },
        orderBy: {
          kelurahan: "asc",
        },
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
