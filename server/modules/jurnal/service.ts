import type { CreateJurnalSchema, GetJurnalQuerySchema } from "./model";
import { createError } from "h3";
import { db } from "~~/server/database";
import { catchError } from "~~/server/utils/error";
import { JurnalRepo } from "./repo";

export const JurnalService = {
  async getPaginatedJurnal(query: GetJurnalQuerySchema) {
    const [err, result] = await catchError(JurnalRepo.getPaginated(query));
    if (err) {
      console.error("Gagal mengambil data jurnal paginated:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data transaksi jurnal",
      });
    }
    return result;
  },

  async getJurnalById(id: number) {
    const [err, item] = await catchError(JurnalRepo.findById(id));
    if (err) {
      console.error(`Gagal mencari jurnal ID ${id}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data transaksi jurnal",
      });
    }

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Data transaksi jurnal tidak ditemukan",
      });
    }

    return item;
  },

  async createJurnal(data: CreateJurnalSchema, userId: number) {
    const [codeErr, autoCode] = await catchError(
      JurnalRepo.generateNextKodeTransaksi(data.tanggalTransaksi),
    );
    if (codeErr || !autoCode) {
      console.error("Gagal membuat kode transaksi jurnal:", codeErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat nomor transaksi jurnal",
      });
    }

    const [txErr, created] = await catchError(
      db.transaction(async (tx) => {
        const header = await JurnalRepo.createHeader(
          {
            kodeTransaksi: autoCode,
            tanggalTransaksi: data.tanggalTransaksi,
            keterangan: data.keterangan || null,
            userId,
          },
          tx,
        );

        if (!header) {
          throw new Error("Gagal membuat header jurnal");
        }

        const detailValues = data.details.map(d => ({
          jurnalId: header.id,
          akunId: d.akunId,
          debit: Math.round(d.debit || 0),
          kredit: Math.round(d.kredit || 0),
        }));

        const details = await JurnalRepo.insertDetails(detailValues, tx);

        return { header, details };
      }),
    );

    if (txErr) {
      console.error("Gagal menyimpan transaksi jurnal:", txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menyimpan transaksi jurnal",
      });
    }

    return created;
  },

  async deleteJurnal(id: number) {
    const [findErr, existing] = await catchError(JurnalRepo.findById(id));
    if (findErr) {
      console.error(`Gagal memeriksa keberadaan jurnal ID ${id}:`, findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal memeriksa data jurnal",
      });
    }

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Data transaksi jurnal tidak ditemukan",
      });
    }

    const [deleteErr] = await catchError(JurnalRepo.delete(id));
    if (deleteErr) {
      console.error(`Gagal menghapus jurnal ID ${id}:`, deleteErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menghapus data transaksi jurnal",
      });
    }

    return { success: true };
  },

  async deleteBulkJurnal(ids: number[]) {
    const [err] = await catchError(JurnalRepo.deleteBulk(ids));
    if (err) {
      console.error("Gagal menghapus transaksi jurnal secara massal:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menghapus transaksi jurnal",
      });
    }
    return { success: true };
  },
};
