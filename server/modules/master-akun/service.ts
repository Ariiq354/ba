import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { MasterAkunRepo } from "./repo";

export const MasterAkunService = {
  async createAkun(data: CreateAkunSchema) {
    const [findErr, existing] = await catchError(MasterAkunRepo.findByKodeAkun(data.kodeAkun));
    if (findErr) {
      console.error("Gagal memeriksa kode akun:", findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal memeriksa kode akun",
      });
    }

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "Conflict",
        message: "Kode akun sudah digunakan",
      });
    }

    const [createErr, newAkun] = await catchError(MasterAkunRepo.create(data));
    if (createErr) {
      console.error("Gagal membuat data akun:", createErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat data akun",
      });
    }

    return newAkun;
  },

  async getPaginatedAkun(query: GetAkunQuerySchema) {
    const [err, result] = await catchError(MasterAkunRepo.getPaginated(query));
    if (err) {
      console.error("Gagal mengambil data akun:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data akun",
      });
    }
    return result;
  },

  async updateAkun(id: number, data: UpdateAkunSchema) {
    const [findErr, existing] = await catchError(MasterAkunRepo.findById(id));
    if (findErr) {
      console.error(`Gagal mencari akun dengan ID ${id}:`, findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mencari data akun",
      });
    }

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Data akun tidak ditemukan",
      });
    }

    if (data.kodeAkun && data.kodeAkun !== existing.kodeAkun) {
      const [checkErr, other] = await catchError(MasterAkunRepo.findByKodeAkun(data.kodeAkun));
      if (checkErr) {
        console.error("Gagal memeriksa duplikasi kode akun:", checkErr);
        throw createError({
          statusCode: 500,
          statusMessage: "Database Error",
          message: "Gagal memeriksa duplikasi kode akun",
        });
      }

      if (other) {
        throw createError({
          statusCode: 400,
          statusMessage: "Conflict",
          message: "Kode akun sudah digunakan oleh akun lain",
        });
      }
    }

    const [updateErr, updated] = await catchError(MasterAkunRepo.update(id, data));
    if (updateErr) {
      console.error(`Gagal memperbarui akun dengan ID ${id}:`, updateErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal memperbarui data akun",
      });
    }

    return updated;
  },

  async deleteAkun(ids: number[]) {
    const [err, deleted] = await catchError(MasterAkunRepo.deleteBulk(ids));
    if (err) {
      console.error("Gagal menghapus data akun:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menghapus data akun (kemungkinan sedang digunakan dalam transaksi)",
      });
    }
    return deleted;
  },
};
