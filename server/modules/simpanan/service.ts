import type {
  CreatePenarikanInput,
  CreateSetoranInput,
  CreateSetorSahamInput,
  GetMutasiQueryInput,
  RejectMutasiInput,
} from "./model";
import { createError } from "h3";
import { db } from "~~/server/database";
import { catchError } from "~~/server/utils/error";
import { AkunId } from "~~/shared/akunId";
import { SimpananRepo } from "./repo";

export const SimpananService = {
  async getSaldo(userId: number) {
    const [err, saldo] = await catchError(SimpananRepo.getSaldo(userId));
    if (err) {
      console.error(`Gagal mengambil saldo user ${userId}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data saldo",
      });
    }
    return saldo;
  },

  async getLatestSahamPrice() {
    const [err, sahamPrice] = await catchError(SimpananRepo.getLatestSahamPrice());
    if (err) {
      console.error("Gagal mengambil harga saham terbaru:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data harga saham",
      });
    }
    return sahamPrice;
  },

  async getPaginatedMutasi(query: GetMutasiQueryInput) {
    const [err, result] = await catchError(SimpananRepo.getPaginatedMutasi(query));
    if (err) {
      console.error("Gagal mengambil paginasi mutasi simpanan:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mengambil data mutasi simpanan",
      });
    }
    return result;
  },

  async createSetoran(userId: number, data: CreateSetoranInput) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const [codeErr, kodeTransaksi] = await catchError(
      SimpananRepo.generateKodeTransaksi(todayStr),
    );
    if (codeErr || !kodeTransaksi) {
      console.error("Gagal membuat kode transaksi setoran:", codeErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat nomor transaksi setoran",
      });
    }

    const [txErr, row] = await catchError(
      db.transaction(async (tx) => {
        await SimpananRepo.ensureSaldoRecordTx(tx, userId);
        return await SimpananRepo.insertMutasi(
          {
            kodeTransaksi,
            userId,
            akunId: data.akunId,
            jenisTransaksi: "setoran",
            nilaiTransaksi: data.nilaiTransaksi,
            agioSaham: 0,
            saldoSetelahTransaksi: 0,
            tanggalTransaksi: todayStr,
            statusApproved: "pending",
            keterangan: data.keterangan ? data.keterangan.replace(/\[SAHAM\]/g, "SAHAM") : "Setoran Simpanan Berjangka",
            createdBy: userId,
          },
          tx,
        );
      }),
    );

    if (txErr) {
      console.error("Gagal membuat pengajuan setoran:", txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat pengajuan setoran",
      });
    }

    return row;
  },

  async createPenarikan(userId: number, data: CreatePenarikanInput) {
    const [saldoErr, saldo] = await catchError(SimpananRepo.getSaldo(userId));
    if (saldoErr) {
      console.error(`Gagal memeriksa saldo user ${userId}:`, saldoErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal memeriksa data saldo",
      });
    }

    if (saldo.effectiveSaldo < data.nilaiTransaksi) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: `Saldo efektif tidak mencukupi untuk penarikan sebesar Rp ${data.nilaiTransaksi.toLocaleString("id-ID")}. Saldo Efektif: Rp ${saldo.effectiveSaldo.toLocaleString("id-ID")}`,
      });
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const [codeErr, kodeTransaksi] = await catchError(
      SimpananRepo.generateKodeTransaksi(todayStr),
    );
    if (codeErr || !kodeTransaksi) {
      console.error("Gagal membuat kode transaksi penarikan:", codeErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat nomor transaksi penarikan",
      });
    }

    const [txErr, row] = await catchError(
      db.transaction(async (tx) => {
        await SimpananRepo.ensureSaldoRecordTx(tx, userId);
        return await SimpananRepo.insertMutasi(
          {
            kodeTransaksi,
            userId,
            akunId: data.akunId,
            jenisTransaksi: "penarikan",
            nilaiTransaksi: data.nilaiTransaksi,
            agioSaham: 0,
            saldoSetelahTransaksi: 0,
            tanggalTransaksi: todayStr,
            statusApproved: "pending",
            keterangan: data.keterangan || "Penarikan Simpanan Berjangka",
            createdBy: userId,
          },
          tx,
        );
      }),
    );

    if (txErr) {
      console.error("Gagal membuat pengajuan penarikan:", txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat pengajuan penarikan",
      });
    }

    return row;
  },

  async createSetorSaham(userId: number, data: CreateSetorSahamInput) {
    const [sahamErr, latestSaham] = await catchError(SimpananRepo.getLatestSahamPrice());
    if (sahamErr) {
      console.error("Gagal memeriksa harga saham:", sahamErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal memeriksa harga saham",
      });
    }

    if (!latestSaham) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Master harga saham belum diatur oleh administrator",
      });
    }

    const hargaNominal = latestSaham.hargaNominal;
    const hargaJual = latestSaham.hargaJual;
    const nilaiTransaksi = data.jumlahLembar * hargaNominal;
    const agioSaham = data.jumlahLembar * Math.max(0, hargaJual - hargaNominal);
    const totalBayar = nilaiTransaksi + agioSaham;
    const defaultKet = `[SAHAM] Setor Saham ${data.jumlahLembar} lembar @ Rp ${hargaJual.toLocaleString("id-ID")} (Total: Rp ${totalBayar.toLocaleString("id-ID")})`;
    const keterangan = data.keterangan ? `[SAHAM] ${data.keterangan}` : defaultKet;

    const todayStr = new Date().toISOString().substring(0, 10);
    const [codeErr, kodeTransaksi] = await catchError(
      SimpananRepo.generateKodeTransaksi(todayStr),
    );
    if (codeErr || !kodeTransaksi) {
      console.error("Gagal membuat kode transaksi setor saham:", codeErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat nomor transaksi setor saham",
      });
    }

    const [txErr, row] = await catchError(
      db.transaction(async (tx) => {
        await SimpananRepo.ensureSaldoRecordTx(tx, userId);
        return await SimpananRepo.insertMutasi(
          {
            kodeTransaksi,
            userId,
            akunId: data.akunId,
            jenisTransaksi: "setoran",
            nilaiTransaksi,
            agioSaham,
            saldoSetelahTransaksi: 0,
            tanggalTransaksi: todayStr,
            statusApproved: "pending",
            keterangan,
            createdBy: userId,
          },
          tx,
        );
      }),
    );

    if (txErr) {
      console.error("Gagal membuat pengajuan setor saham:", txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal membuat pengajuan setor saham",
      });
    }

    return row;
  },

  async deletePendingMutasi(id: number, userId: number) {
    const [findErr, existing] = await catchError(SimpananRepo.getMutasiById(id));
    if (findErr) {
      console.error(`Gagal mencari mutasi ID ${id}:`, findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mencari data mutasi",
      });
    }

    if (!existing || existing.userId !== userId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Data mutasi tidak ditemukan",
      });
    }

    if (existing.statusApproved !== "pending") {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Transaksi yang sudah diproses (approved/rejected) tidak dapat dihapus",
      });
    }

    const [deleteErr, deleted] = await catchError(SimpananRepo.deleteMutasi(id));
    if (deleteErr) {
      console.error(`Gagal menghapus mutasi ID ${id}:`, deleteErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menghapus mutasi pending",
      });
    }

    return deleted;
  },

  async approveMutasi(id: number, adminId: number) {
    const [txErr, updatedMutasi] = await catchError(
      db.transaction(async (tx) => {
        const mutasi = await SimpananRepo.getMutasiForUpdate(id, tx);
        if (!mutasi) {
          throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Data mutasi simpanan tidak ditemukan",
          });
        }

        if (mutasi.statusApproved !== "pending") {
          throw createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            message: "Transaksi ini sudah diproses sebelumnya",
          });
        }

        await SimpananRepo.ensureSaldoRecordTx(tx, mutasi.userId);
        const saldo = await SimpananRepo.getSaldoRecordForUpdate(mutasi.userId, tx);

        const isSaham = mutasi.keterangan?.includes("[SAHAM]") || mutasi.agioSaham > 0;
        let newSaldo = 0;

        if (isSaham) {
          // Setoran Saham
          newSaldo = (saldo?.saldoSaham ?? 0) + mutasi.nilaiTransaksi;
          await SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoSaham: newSaldo }, tx);
        }
        else if (mutasi.jenisTransaksi === "setoran") {
          // Setoran Tabungan
          newSaldo = (saldo?.saldoTabungan ?? 0) + mutasi.nilaiTransaksi;
          await SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoTabungan: newSaldo }, tx);
        }
        else {
          // Penarikan Tabungan: validate effective balance (considering other pending withdrawals)
          const currentTabungan = saldo?.saldoTabungan ?? 0;
          const otherPending = await SimpananRepo.getOtherPendingPenarikan(mutasi.userId, id, tx);
          const effectiveSaldoAtApproval = currentTabungan - otherPending;

          if (effectiveSaldoAtApproval < mutasi.nilaiTransaksi) {
            throw createError({
              statusCode: 400,
              statusMessage: "Validation Error",
              message: `Saldo efektif tidak mencukupi untuk approval penarikan ini. Saldo Tabungan: Rp ${currentTabungan.toLocaleString("id-ID")}, Penarikan Pending Lainnya: Rp ${otherPending.toLocaleString("id-ID")}, Efektif: Rp ${effectiveSaldoAtApproval.toLocaleString("id-ID")}`,
            });
          }

          newSaldo = currentTabungan - mutasi.nilaiTransaksi;
          await SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoTabungan: newSaldo }, tx);
        }

        const updated = await SimpananRepo.updateMutasiStatus(
          id,
          {
            statusApproved: "approved",
            saldoSetelahTransaksi: newSaldo,
            approvedBy: adminId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          },
          tx,
        );

        // Auto Generate Journal Entry Code (TRX-YYYYMMDD-SEQ3)
        const journalCode = await SimpananRepo.generateJournalCode(mutasi.tanggalTransaksi, tx);
        const journalKet = mutasi.keterangan || (isSaham ? "Setor Saham" : mutasi.jenisTransaksi === "setoran" ? "Setoran Simpanan Berjangka" : "Penarikan Simpanan Berjangka");

        let detailRows: { akunId: number; debit: number; kredit: number }[] = [];
        if (isSaham) {
          const totalDebit = mutasi.nilaiTransaksi + mutasi.agioSaham;
          detailRows = [
            {
              akunId: mutasi.akunId,
              debit: totalDebit,
              kredit: 0,
            },
            {
              akunId: AkunId.SAHAM50,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ];

          if (mutasi.agioSaham > 0) {
            detailRows.push({
              akunId: AkunId.AGIOSAHAM,
              debit: 0,
              kredit: mutasi.agioSaham,
            });
          }
        }
        else if (mutasi.jenisTransaksi === "setoran") {
          detailRows = [
            {
              akunId: mutasi.akunId,
              debit: mutasi.nilaiTransaksi,
              kredit: 0,
            },
            {
              akunId: AkunId.SIMPANANBERJANGKA,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ];
        }
        else {
          detailRows = [
            {
              akunId: AkunId.SIMPANANBERJANGKA,
              debit: mutasi.nilaiTransaksi,
              kredit: 0,
            },
            {
              akunId: mutasi.akunId,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ];
        }

        await SimpananRepo.createJurnalWithDetails(
          {
            kodeTransaksi: journalCode,
            tanggalTransaksi: mutasi.tanggalTransaksi,
            keterangan: journalKet,
            userId: mutasi.userId,
          },
          detailRows,
          tx,
        );

        return updated;
      }),
    );

    if (txErr) {
      if ("statusCode" in (txErr as any)) {
        throw txErr;
      }
      console.error(`Gagal approve mutasi ID ${id}:`, txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menyetujui mutasi",
      });
    }

    return updatedMutasi;
  },

  async rejectMutasi(id: number, adminId: number, data: RejectMutasiInput) {
    const [findErr, mutasi] = await catchError(SimpananRepo.getMutasiById(id));
    if (findErr) {
      console.error(`Gagal mencari mutasi ID ${id}:`, findErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal mencari data mutasi",
      });
    }

    if (!mutasi) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Data mutasi simpanan tidak ditemukan",
      });
    }

    if (mutasi.statusApproved !== "pending") {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        message: "Transaksi ini sudah diproses sebelumnya",
      });
    }

    const [updateErr, rejected] = await catchError(
      SimpananRepo.updateMutasiStatus(id, {
        statusApproved: "rejected",
        alasanPenolakan: data.alasanPenolakan,
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    if (updateErr) {
      console.error(`Gagal reject mutasi ID ${id}:`, updateErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
        message: "Gagal menolak mutasi",
      });
    }

    return rejected;
  },
};
