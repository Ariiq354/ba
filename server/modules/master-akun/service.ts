import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateAkunSchema, UpdateAkunSchema } from "./model";
import { errAsync } from "neverthrow";
import { MasterAkunRepo } from "./repo";

export const MasterAkunService = {
  createAkun(data: CreateAkunSchema) {
    return MasterAkunRepo.findByKodeAkun(data.kodeAkun).andThen((existing) => {
      if (existing) {
        return errAsync({
          code: "KODE_AKUN_EXISTS",
          message: "Kode akun sudah digunakan",
        } as const);
      }
      return MasterAkunRepo.create(data);
    });
  },

  getPaginatedAkun(query: PaginationSchema) {
    return MasterAkunRepo.getPaginated(query);
  },

  updateAkun(id: number, data: UpdateAkunSchema) {
    return MasterAkunRepo.findById(id).andThen((existing) => {
      if (!existing) {
        return errAsync({
          code: "AKUN_NOT_FOUND",
          message: "Data akun tidak ditemukan",
        } as const);
      }

      if (data.kodeAkun && data.kodeAkun !== existing.kodeAkun) {
        return MasterAkunRepo.findByKodeAkun(data.kodeAkun).andThen((other) => {
          if (other) {
            return errAsync({
              code: "KODE_AKUN_EXISTS",
              message: "Kode akun sudah digunakan oleh akun lain",
            } as const);
          }
          return MasterAkunRepo.update(id, data);
        });
      }

      return MasterAkunRepo.update(id, data);
    });
  },

  deleteAkun(ids: number[]) {
    return MasterAkunRepo.deleteBulk(ids);
  },
};
