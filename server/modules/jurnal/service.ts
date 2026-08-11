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
    return JurnalRepo.generateNextKodeTransaksi(data.tanggalTransaksi).andThen((autoCode) => {
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
