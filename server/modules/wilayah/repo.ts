import type { DbClient } from "~~/server/database";
import { db } from "~~/server/database";

export const WilayahRepo = {
  async getProvinsi(client: DbClient = db) {
    return await client.query.provinsi.findMany({
      orderBy: {
        provinsi: "asc",
      },
    });
  },

  async getKotaByProvinsiId(idProvinsi: string, client: DbClient = db) {
    return await client.query.kota.findMany({
      where: {
        idProvinsi,
      },
      orderBy: {
        kota: "asc",
      },
    });
  },

  async getKecamatanByKotaId(idKota: string, client: DbClient = db) {
    return await client.query.kecamatan.findMany({
      where: {
        idKota,
      },
      orderBy: {
        kecamatan: "asc",
      },
    });
  },

  async getKelurahanByKecamatanId(idKecamatan: string, client: DbClient = db) {
    return await client.query.kelurahan.findMany({
      where: {
        idKecamatan,
      },
      orderBy: {
        kelurahan: "asc",
      },
    });
  },
};
