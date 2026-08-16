import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { WilayahRepo } from "./repo";

export const WilayahService = {
  async getProvinsi() {
    const [err, data] = await catchError(WilayahRepo.getProvinsi());
    if (err) {
      console.error("Gagal mengambil data provinsi:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data provinsi",
      });
    }
    return data;
  },

  async getKotaByProvinsiId(idProvinsi: string) {
    const [err, data] = await catchError(WilayahRepo.getKotaByProvinsiId(idProvinsi));
    if (err) {
      console.error(`Gagal mengambil data kota untuk provinsi ${idProvinsi}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data kota",
      });
    }
    return data;
  },

  async getKecamatanByKotaId(idKota: string) {
    const [err, data] = await catchError(WilayahRepo.getKecamatanByKotaId(idKota));
    if (err) {
      console.error(`Gagal mengambil data kecamatan untuk kota ${idKota}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data kecamatan",
      });
    }
    return data;
  },

  async getKelurahanByKecamatanId(idKecamatan: string) {
    const [err, data] = await catchError(WilayahRepo.getKelurahanByKecamatanId(idKecamatan));
    if (err) {
      console.error(`Gagal mengambil data kelurahan untuk kecamatan ${idKecamatan}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data kelurahan",
      });
    }
    return data;
  },
};
