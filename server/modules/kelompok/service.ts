import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { KelompokRepo } from "./repo";

export const KelompokService = {
  async getOptionsKelompok() {
    const [err, data] = await catchError(KelompokRepo.getOptionsKelompok());
    if (err) {
      console.error("Gagal mengambil data opsi kelompok:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data opsi kelompok",
      });
    }
    return data;
  },
};
