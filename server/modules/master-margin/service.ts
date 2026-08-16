import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { MasterMarginRepo } from "./repo";

export const MasterMarginService = {
  async createMargin(data: CreateMarginSchema) {
    const [err, created] = await catchError(MasterMarginRepo.create(data));
    if (err) {
      console.error("Gagal membuat data margin:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal membuat data margin",
      });
    }
    return created;
  },

  async getPaginatedMargin(query: PaginationSchema) {
    const [err, result] = await catchError(MasterMarginRepo.getPaginated(query));
    if (err) {
      console.error("Gagal mengambil data paginasi margin:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data margin",
      });
    }
    return result;
  },

  async updateMargin(id: number, data: UpdateMarginSchema) {
    const [updateErr, updated] = await catchError(MasterMarginRepo.update(id, data));
    if (updateErr) {
      console.error(`Gagal memperbarui margin dengan ID ${id}:`, updateErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal memperbarui data margin",
      });
    }

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: "Data margin tidak ditemukan",
      });
    }

    return updated;
  },

  async deleteMargin(ids: number[]) {
    const [err, deleted] = await catchError(MasterMarginRepo.deleteBulk(ids));
    if (err) {
      console.error("Gagal menghapus data margin:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal menghapus data margin",
      });
    }
    return deleted;
  },
};
