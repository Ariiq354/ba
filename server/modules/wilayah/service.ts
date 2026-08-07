import { WilayahRepo } from "./repo";

export const WilayahService = {
  getProvinsi() {
    return WilayahRepo.getProvinsi();
  },

  getKotaByProvinsiId(idProvinsi: string) {
    return WilayahRepo.getKotaByProvinsiId(idProvinsi);
  },

  getKecamatanByKotaId(idKota: string) {
    return WilayahRepo.getKecamatanByKotaId(idKota);
  },

  getKelurahanByKecamatanId(idKecamatan: string) {
    return WilayahRepo.getKelurahanByKecamatanId(idKecamatan);
  },
};
