import type {
  CreatePenarikanInput,
  CreateSetoranInput,
  CreateSetorSahamInput,
  GetMutasiQueryInput,
  RejectMutasiInput,
} from "./model";
import { SimpananRepo } from "./repo";

export const SimpananService = {
  getSaldo(userId: number) {
    return SimpananRepo.getSaldo(userId);
  },

  getLatestSahamPrice() {
    return SimpananRepo.getLatestSahamPrice();
  },

  getPaginatedMutasi(query: GetMutasiQueryInput) {
    return SimpananRepo.getPaginatedMutasi(query);
  },

  createSetoran(userId: number, data: CreateSetoranInput) {
    return SimpananRepo.createSetoran(userId, data);
  },

  createPenarikan(userId: number, data: CreatePenarikanInput) {
    return SimpananRepo.createPenarikan(userId, data);
  },

  createSetorSaham(userId: number, data: CreateSetorSahamInput) {
    return SimpananRepo.createSetorSaham(userId, data);
  },

  deletePendingMutasi(id: number, userId: number) {
    return SimpananRepo.deletePendingMutasi(id, userId);
  },

  approveMutasi(id: number, adminId: number) {
    return SimpananRepo.approveMutasi(id, adminId);
  },

  rejectMutasi(id: number, adminId: number, data: RejectMutasiInput) {
    return SimpananRepo.rejectMutasi(id, adminId, data.alasanPenolakan);
  },
};
