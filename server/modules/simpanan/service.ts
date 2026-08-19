import type {
  CreatePenarikanInput,
  CreateSetoranInput,
  CreateSetorSahamInput,
  GetMutasiQueryInput,
  RejectMutasiInput,
} from "./model";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { DatabaseError, ItemNotFoundError } from "~~/server/utils/error";
import { AkunId } from "~~/shared/akunId";
import {
  HargaSahamNotConfiguredError,
  InsufficientEffectiveBalanceError,
  MutasiAlreadyProcessedError,
  UnauthorizedMutasiAccessError,
} from "./errors";
import { SimpananRepo } from "./repo";

export const SimpananService = {
  getSaldo: Effect.fn("SimpananService.getSaldo")(function* (userId: number) {
    return yield* SimpananRepo.getSaldo(userId);
  }),

  getLatestSahamPrice: Effect.fn("SimpananService.getLatestSahamPrice")(function* () {
    return yield* SimpananRepo.getLatestSahamPrice();
  }),

  getPaginatedMutasi: Effect.fn("SimpananService.getPaginatedMutasi")(function* (query: GetMutasiQueryInput) {
    return yield* SimpananRepo.findAll(query);
  }),

  createSetoran: Effect.fn("SimpananService.createSetoran")(function* (userId: number, data: CreateSetoranInput) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const kodeTransaksi = yield* SimpananRepo.generateKodeTransaksi(todayStr);

    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          await Effect.runPromise(SimpananRepo.ensureSaldoRecordTx(userId, tx));
          return await Effect.runPromise(
            SimpananRepo.insertMutasi(
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
            ),
          );
        });
      },
      catch: error => new DatabaseError({ error }),
    });
  }),

  createPenarikan: Effect.fn("SimpananService.createPenarikan")(function* (userId: number, data: CreatePenarikanInput) {
    const saldo = yield* SimpananRepo.getSaldo(userId);

    if (saldo.effectiveSaldo < data.nilaiTransaksi) {
      return yield* new InsufficientEffectiveBalanceError({
        required: data.nilaiTransaksi,
        effectiveSaldo: saldo.effectiveSaldo,
      });
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const kodeTransaksi = yield* SimpananRepo.generateKodeTransaksi(todayStr);

    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          await Effect.runPromise(SimpananRepo.ensureSaldoRecordTx(userId, tx));
          return await Effect.runPromise(
            SimpananRepo.insertMutasi(
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
            ),
          );
        });
      },
      catch: error => new DatabaseError({ error }),
    });
  }),

  createSetorSaham: Effect.fn("SimpananService.createSetorSaham")(function* (
    userId: number,
    data: CreateSetorSahamInput,
  ) {
    const latestSaham = yield* SimpananRepo.getLatestSahamPrice();
    if (!latestSaham) {
      return yield* new HargaSahamNotConfiguredError();
    }

    const hargaNominal = latestSaham.hargaNominal;
    const hargaJual = latestSaham.hargaJual;
    const nilaiTransaksi = data.jumlahLembar * hargaNominal;
    const agioSaham = data.jumlahLembar * Math.max(0, hargaJual - hargaNominal);
    const totalBayar = nilaiTransaksi + agioSaham;
    const defaultKet = `[SAHAM] Setor Saham ${data.jumlahLembar} lembar @ Rp ${hargaJual.toLocaleString("id-ID")} (Total: Rp ${totalBayar.toLocaleString("id-ID")})`;
    const keterangan = data.keterangan ? `[SAHAM] ${data.keterangan}` : defaultKet;

    const todayStr = new Date().toISOString().substring(0, 10);
    const kodeTransaksi = yield* SimpananRepo.generateKodeTransaksi(todayStr);

    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          await Effect.runPromise(SimpananRepo.ensureSaldoRecordTx(userId, tx));
          return await Effect.runPromise(
            SimpananRepo.insertMutasi(
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
            ),
          );
        });
      },
      catch: error => new DatabaseError({ error }),
    });
  }),

  deletePendingMutasi: Effect.fn("SimpananService.deletePendingMutasi")(function* (id: number, userId: number) {
    const existing = yield* SimpananRepo.getMutasiById(id);

    if (!existing || existing.userId !== userId) {
      return yield* new UnauthorizedMutasiAccessError({ id });
    }

    if (existing.statusApproved !== "pending") {
      return yield* new MutasiAlreadyProcessedError({ id });
    }

    const deleted = yield* SimpananRepo.deleteMutasi(id);
    if (!deleted) {
      return yield* new ItemNotFoundError({ id });
    }

    return deleted;
  }),

  approveMutasi: Effect.fn("SimpananService.approveMutasi")(function* (id: number, adminId: number) {
    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          const mutasi = await Effect.runPromise(SimpananRepo.getMutasiForUpdate(id, tx));
          if (!mutasi) {
            throw new ItemNotFoundError({ id });
          }

          if (mutasi.statusApproved !== "pending") {
            throw new MutasiAlreadyProcessedError({ id });
          }

          await Effect.runPromise(SimpananRepo.ensureSaldoRecordTx(mutasi.userId, tx));
          const saldo = await Effect.runPromise(SimpananRepo.getSaldoRecordForUpdate(mutasi.userId, tx));

          const isSaham = mutasi.keterangan?.includes("[SAHAM]") || mutasi.agioSaham > 0;
          let newSaldo = 0;

          if (isSaham) {
            newSaldo = (saldo?.saldoSaham ?? 0) + mutasi.nilaiTransaksi;
            await Effect.runPromise(SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoSaham: newSaldo }, tx));
          }
          else if (mutasi.jenisTransaksi === "setoran") {
            newSaldo = (saldo?.saldoTabungan ?? 0) + mutasi.nilaiTransaksi;
            await Effect.runPromise(SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoTabungan: newSaldo }, tx));
          }
          else {
            const currentTabungan = saldo?.saldoTabungan ?? 0;
            const otherPending = await Effect.runPromise(SimpananRepo.getOtherPendingPenarikan(mutasi.userId, id, tx));
            const effectiveSaldoAtApproval = currentTabungan - otherPending;

            if (effectiveSaldoAtApproval < mutasi.nilaiTransaksi) {
              throw new InsufficientEffectiveBalanceError({
                required: mutasi.nilaiTransaksi,
                effectiveSaldo: effectiveSaldoAtApproval,
              });
            }

            newSaldo = currentTabungan - mutasi.nilaiTransaksi;
            await Effect.runPromise(SimpananRepo.updateSaldoRecord(mutasi.userId, { saldoTabungan: newSaldo }, tx));
          }

          const updated = await Effect.runPromise(
            SimpananRepo.updateMutasiStatus(
              id,
              {
                statusApproved: "approved",
                saldoSetelahTransaksi: newSaldo,
                approvedBy: adminId,
                approvedAt: new Date(),
                updatedAt: new Date(),
              },
              tx,
            ),
          );

          const journalCode = await Effect.runPromise(SimpananRepo.generateJournalCode(mutasi.tanggalTransaksi, tx));
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

          await Effect.runPromise(
            SimpananRepo.createJurnalWithDetails(
              {
                kodeTransaksi: journalCode,
                tanggalTransaksi: mutasi.tanggalTransaksi,
                keterangan: journalKet,
                userId: mutasi.userId,
              },
              detailRows,
              tx,
            ),
          );

          return updated;
        });
      },
      catch: (error) => {
        if (
          error instanceof ItemNotFoundError
          || error instanceof MutasiAlreadyProcessedError
          || error instanceof InsufficientEffectiveBalanceError
        ) {
          return error;
        }
        return new DatabaseError({ error });
      },
    });
  }),

  rejectMutasi: Effect.fn("SimpananService.rejectMutasi")(function* (
    id: number,
    adminId: number,
    data: RejectMutasiInput,
  ) {
    const mutasi = yield* SimpananRepo.getMutasiById(id);
    if (!mutasi) {
      return yield* new ItemNotFoundError({ id });
    }

    if (mutasi.statusApproved !== "pending") {
      return yield* new MutasiAlreadyProcessedError({ id });
    }

    const rejected = yield* SimpananRepo.updateMutasiStatus(id, {
      statusApproved: "rejected",
      alasanPenolakan: data.alasanPenolakan,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    });

    return rejected;
  }),
};
