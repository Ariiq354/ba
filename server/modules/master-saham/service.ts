import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateSahamSchema } from "./model";
import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { MasterSahamRepo } from "./repo";

export const MasterSahamService = {
  async createSaham(userId: number, data: CreateSahamSchema) {
    const [err, created] = await catchError(MasterSahamRepo.create(userId, data));
    if (err) {
      console.error("Gagal membuat data master saham:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal membuat data master saham",
      });
    }
    return created;
  },

  async getLatestSaham() {
    const [err, data] = await catchError(MasterSahamRepo.getLatest());
    if (err) {
      console.error("Gagal mengambil data saham terbaru:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data master saham",
      });
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: "Data saham belum tersedia",
      });
    }

    return data;
  },

  async getPaginatedSaham(query: PaginationSchema) {
    const [err, result] = await catchError(MasterSahamRepo.getPaginated(query));
    if (err) {
      console.error("Gagal mengambil data paginasi saham:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data master saham",
      });
    }
    return result;
  },
};
