import type { CreateJurnalSchema, GetJurnalQuerySchema } from "./model";
import { errAsync } from "neverthrow";
import { JurnalRepo } from "./repo";

export const JurnalService = {
  getPaginatedJurnal(query: GetJurnalQuerySchema) {
    return JurnalRepo.getPaginated(query);
  },

  getJurnalById(id: number) {
    return JurnalRepo.findById(id).andThen((item) => {
      if (!item) {
        return errAsync({
          code: "JURNAL_NOT_FOUND",
          message: "Data transaksi jurnal tidak ditemukan",
        } as const);
      }
      return JurnalRepo.findById(id);
    });
  },

  createJurnal(data: CreateJurnalSchema, userId: number) {
    const customCode = data.kodeTransaksi?.trim();

    if (customCode) {
      return JurnalRepo.findByKodeTransaksi(customCode).andThen((existing) => {
        if (existing) {
          return errAsync({
            code: "KODE_TRANSAKSI_EXISTS",
            message: "Kode transaksi sudah digunakan",
          } as const);
        }

        return JurnalRepo.create(data, userId, customCode);
      });
    }

    return JurnalRepo.generateNextKodeTransaksi().andThen((autoCode) => {
      return JurnalRepo.create(data, userId, autoCode);
    });
  },

  deleteJurnal(id: number) {
    return JurnalRepo.findById(id).andThen((existing) => {
      if (!existing) {
        return errAsync({
          code: "JURNAL_NOT_FOUND",
          message: "Data transaksi jurnal tidak ditemukan",
        } as const);
      }
      return JurnalRepo.delete(id);
    });
  },
};
