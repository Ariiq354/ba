import { Effect } from "effect";
import { WilayahRepo } from "./repo";

export const WilayahService = {
  getProvinsi: Effect.fn("WilayahService.getProvinsi")(function* () {
    return yield* WilayahRepo.findProvinsi();
  }),

  getKotaByProvinsiId: Effect.fn("WilayahService.getKotaByProvinsiId")(function* (idProvinsi: string) {
    return yield* WilayahRepo.findKotaByProvinsiId(idProvinsi);
  }),

  getKecamatanByKotaId: Effect.fn("WilayahService.getKecamatanByKotaId")(function* (idKota: string) {
    return yield* WilayahRepo.findKecamatanByKotaId(idKota);
  }),

  getKelurahanByKecamatanId: Effect.fn("WilayahService.getKelurahanByKecamatanId")(function* (idKecamatan: string) {
    return yield* WilayahRepo.findKelurahanByKecamatanId(idKecamatan);
  }),
};
