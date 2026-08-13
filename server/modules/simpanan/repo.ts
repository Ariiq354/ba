import type {
  CreatePenarikanInput,
  CreateSetoranInput,
  CreateSetorSahamInput,
  GetMutasiQueryInput,
} from "./model";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { user } from "~~/server/database/schema/auth";
import { jurnal, jurnalDetail } from "~~/server/database/schema/jurnal";
import { saham } from "~~/server/database/schema/master";
import { mutasiSimpanan, saldoSimpanan } from "~~/server/database/schema/simpanan";
import { AkunId } from "~~/shared/akunId";

export interface SaldoInfo {
  saldoTabungan: number;
  saldoSaham: number;
  sumPendingPenarikan: number;
  effectiveSaldo: number;
}

export interface MutasiSimpananRow {
  id: number;
  kodeTransaksi: string;
  userId: number;
  userName: string | null;
  akunId: number;
  kodeAkun: string | null;
  namaAkun: string | null;
  jenisTransaksi: "setoran" | "penarikan";
  nilaiTransaksi: number;
  agioSaham: number;
  saldoSetelahTransaksi: number;
  tanggalTransaksi: string;
  statusApproved: "pending" | "approved" | "rejected";
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export const SimpananRepo = {
  getLatestSahamPrice() {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(saham)
        .orderBy(desc(saham.id))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  getSaldo(userId: number) {
    return ResultAsync.fromPromise(
      Promise.all([
        db
          .select()
          .from(saldoSimpanan)
          .where(eq(saldoSimpanan.userId, userId))
          .limit(1),
        db
          .select({
            totalPending: sql<number>`coalesce(sum(${mutasiSimpanan.nilaiTransaksi}), 0)::int`,
          })
          .from(mutasiSimpanan)
          .where(
            and(
              eq(mutasiSimpanan.userId, userId),
              eq(mutasiSimpanan.jenisTransaksi, "penarikan"),
              eq(mutasiSimpanan.statusApproved, "pending"),
            ),
          ),
      ]),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(([saldoRows, pendingRows]): SaldoInfo => {
      const saldoTabungan = saldoRows[0]?.saldoTabungan ?? 0;
      const saldoSaham = saldoRows[0]?.saldoSaham ?? 0;
      const sumPendingPenarikan = pendingRows[0]?.totalPending ?? 0;
      const effectiveSaldo = Math.max(0, saldoTabungan - sumPendingPenarikan);
      return {
        saldoTabungan,
        saldoSaham,
        sumPendingPenarikan,
        effectiveSaldo,
      };
    });
  },

  generateKodeTransaksi(tanggalTransaksi?: string) {
    const dateObj = tanggalTransaksi ? new Date(tanggalTransaksi) : new Date();
    const dateStr = Number.isNaN(dateObj.getTime())
      ? new Date().toISOString().substring(0, 10).replace(/-/g, "")
      : dateObj.toISOString().substring(0, 10).replace(/-/g, "");
    const prefix = `STR-${dateStr}-`;

    return ResultAsync.fromPromise(
      db
        .select({ kodeTransaksi: mutasiSimpanan.kodeTransaksi })
        .from(mutasiSimpanan)
        .where(ilike(mutasiSimpanan.kodeTransaksi, `${prefix}%`))
        .orderBy(desc(mutasiSimpanan.kodeTransaksi))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map((rows) => {
      if (!rows.length || !rows[0]?.kodeTransaksi) {
        return `${prefix}001`;
      }
      const lastCode = rows[0].kodeTransaksi;
      const parts = lastCode.split("-");
      const seqStr = parts[parts.length - 1];
      const seqNum = Number.parseInt(seqStr || "0", 10);
      const nextSeq = String(seqNum + 1).padStart(3, "0");
      return `${prefix}${nextSeq}`;
    });
  },

  ensureSaldoRecordTx(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], userId: number) {
    return tx
      .select()
      .from(saldoSimpanan)
      .where(eq(saldoSimpanan.userId, userId))
      .limit(1)
      .then(async (rows) => {
        if (!rows.length) {
          await tx.insert(saldoSimpanan).values({
            userId,
            saldoTabungan: 0,
            saldoSaham: 0,
          });
        }
      });
  },

  createSetoran(userId: number, data: CreateSetoranInput) {
    const todayStr = new Date().toISOString().substring(0, 10);
    return this.generateKodeTransaksi(todayStr).andThen(kodeTransaksi =>
      ResultAsync.fromPromise(
        db.transaction(async (tx) => {
          await this.ensureSaldoRecordTx(tx, userId);
          const [row] = await tx
            .insert(mutasiSimpanan)
            .values({
              kodeTransaksi,
              userId,
              akunId: data.akunId,
              jenisTransaksi: "setoran",
              nilaiTransaksi: data.nilaiTransaksi,
              agioSaham: 0,
              saldoSetelahTransaksi: 0,
              tanggalTransaksi: todayStr,
              statusApproved: "pending",
              keterangan: data.keterangan || "Setoran Simpanan Berjangka",
              createdBy: userId,
            })
            .returning();
          return row;
        }),
        cause => ({ code: "DATABASE_ERROR", cause } as const),
      ),
    );
  },

  createPenarikan(userId: number, data: CreatePenarikanInput) {
    return this.getSaldo(userId).andThen((saldo) => {
      if (saldo.effectiveSaldo < data.nilaiTransaksi) {
        return ResultAsync.fromPromise(
          Promise.reject({
            code: "INSUFFICIENT_BALANCE",
            message: `Saldo efektif tidak mencukupi untuk penarikan sebesar Rp ${data.nilaiTransaksi.toLocaleString("id-ID")}. Saldo Efektif: Rp ${saldo.effectiveSaldo.toLocaleString("id-ID")}`,
          }),
          err => err as { code: string; message: string },
        );
      }

      const todayStr = new Date().toISOString().substring(0, 10);
      return this.generateKodeTransaksi(todayStr).andThen(kodeTransaksi =>
        ResultAsync.fromPromise(
          db.transaction(async (tx) => {
            await this.ensureSaldoRecordTx(tx, userId);
            const [row] = await tx
              .insert(mutasiSimpanan)
              .values({
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
              })
              .returning();
            return row;
          }),
          cause => ({ code: "DATABASE_ERROR", cause } as const),
        ),
      );
    });
  },

  createSetorSaham(userId: number, data: CreateSetorSahamInput) {
    return this.getLatestSahamPrice().andThen((latestSaham) => {
      if (!latestSaham) {
        return ResultAsync.fromPromise(
          Promise.reject({
            code: "SAHAM_MASTER_NOT_FOUND",
            message: "Master harga saham belum diatur oleh administrator",
          }),
          err => err as { code: string; message: string },
        );
      }

      const hargaNominal = latestSaham.hargaNominal;
      const hargaJual = latestSaham.hargaJual;
      const nilaiTransaksi = data.jumlahLembar * hargaNominal;
      const agioSaham = data.jumlahLembar * Math.max(0, hargaJual - hargaNominal);
      const totalBayar = nilaiTransaksi + agioSaham;
      const defaultKet = `[SAHAM] Setor Saham ${data.jumlahLembar} lembar @ Rp ${hargaJual.toLocaleString("id-ID")} (Total: Rp ${totalBayar.toLocaleString("id-ID")})`;
      const keterangan = data.keterangan ? `[SAHAM] ${data.keterangan}` : defaultKet;

      const todayStr = new Date().toISOString().substring(0, 10);
      return this.generateKodeTransaksi(todayStr).andThen(kodeTransaksi =>
        ResultAsync.fromPromise(
          db.transaction(async (tx) => {
            await this.ensureSaldoRecordTx(tx, userId);
            const [row] = await tx
              .insert(mutasiSimpanan)
              .values({
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
              })
              .returning();
            return row;
          }),
          cause => ({ code: "DATABASE_ERROR", cause } as const),
        ),
      );
    });
  },

  deletePendingMutasi(id: number, userId: number) {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(mutasiSimpanan)
        .where(eq(mutasiSimpanan.id, id))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).andThen((rows) => {
      const existing = rows[0];
      if (!existing || existing.userId !== userId) {
        return ResultAsync.fromPromise(
          Promise.reject({
            code: "NOT_FOUND",
            message: "Data mutasi tidak ditemukan",
          }),
          err => err as { code: string; message: string },
        );
      }

      if (existing.statusApproved !== "pending") {
        return ResultAsync.fromPromise(
          Promise.reject({
            code: "CANNOT_DELETE_PROCESSED",
            message: "Transaksi yang sudah diproses (approved/rejected) tidak dapat dihapus",
          }),
          err => err as { code: string; message: string },
        );
      }

      return ResultAsync.fromPromise(
        db
          .delete(mutasiSimpanan)
          .where(eq(mutasiSimpanan.id, id))
          .returning(),
        cause => ({ code: "DATABASE_ERROR", cause } as const),
      ).map(res => res[0] ?? null);
    });
  },

  approveMutasi(id: number, adminId: number) {
    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
        const [mutasi] = await tx
          .select()
          .from(mutasiSimpanan)
          .where(eq(mutasiSimpanan.id, id))
          .for("update");

        if (!mutasi) {
          throw { code: "NOT_FOUND", message: "Data mutasi simpanan tidak ditemukan" };
        }

        if (mutasi.statusApproved !== "pending") {
          throw { code: "ALREADY_PROCESSED", message: "Transaksi ini sudah diproses sebelumnya" };
        }

        await this.ensureSaldoRecordTx(tx, mutasi.userId);

        const [saldo] = await tx
          .select()
          .from(saldoSimpanan)
          .where(eq(saldoSimpanan.userId, mutasi.userId))
          .for("update");

        const isSaham = mutasi.keterangan?.includes("[SAHAM]") || mutasi.agioSaham > 0;
        let newSaldo = 0;

        if (isSaham) {
          // Setoran Saham
          newSaldo = (saldo?.saldoSaham ?? 0) + mutasi.nilaiTransaksi;
          await tx
            .update(saldoSimpanan)
            .set({ saldoSaham: newSaldo, updatedAt: new Date() })
            .where(eq(saldoSimpanan.userId, mutasi.userId));
        } else if (mutasi.jenisTransaksi === "setoran") {
          // Setoran Tabungan
          newSaldo = (saldo?.saldoTabungan ?? 0) + mutasi.nilaiTransaksi;
          await tx
            .update(saldoSimpanan)
            .set({ saldoTabungan: newSaldo, updatedAt: new Date() })
            .where(eq(saldoSimpanan.userId, mutasi.userId));
        } else {
          // Penarikan Tabungan
          const currentTabungan = saldo?.saldoTabungan ?? 0;
          if (currentTabungan < mutasi.nilaiTransaksi) {
            throw {
              code: "INSUFFICIENT_BALANCE",
              message: `Saldo tabungan user tidak mencukupi untuk approval penarikan. Saldo saat ini: Rp ${currentTabungan.toLocaleString("id-ID")}`,
            };
          }
          newSaldo = currentTabungan - mutasi.nilaiTransaksi;
          await tx
            .update(saldoSimpanan)
            .set({ saldoTabungan: newSaldo, updatedAt: new Date() })
            .where(eq(saldoSimpanan.userId, mutasi.userId));
        }

        // Update mutasi status & saldoSetelahTransaksi
        const [updatedMutasi] = await tx
          .update(mutasiSimpanan)
          .set({
            statusApproved: "approved",
            saldoSetelahTransaksi: newSaldo,
            approvedBy: adminId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(mutasiSimpanan.id, id))
          .returning();

        // Auto Generate Journal Entry Code (TRX-YYYYMMDD-SEQ3)
        const dateStr = mutasi.tanggalTransaksi.replace(/-/g, "");
        const prefix = `TRX-${dateStr}-`;
        const lastJurnalRows = await tx
          .select({ kodeTransaksi: jurnal.kodeTransaksi })
          .from(jurnal)
          .where(ilike(jurnal.kodeTransaksi, `${prefix}%`))
          .orderBy(desc(jurnal.kodeTransaksi))
          .limit(1);

        let journalCode = `${prefix}001`;
        if (lastJurnalRows.length && lastJurnalRows[0]?.kodeTransaksi) {
          const parts = lastJurnalRows[0].kodeTransaksi.split("-");
          const seqNum = Number.parseInt(parts[parts.length - 1] || "0", 10);
          journalCode = `${prefix}${String(seqNum + 1).padStart(3, "0")}`;
        }

        const journalKet = mutasi.keterangan || (isSaham ? "Setor Saham" : mutasi.jenisTransaksi === "setoran" ? "Setoran Simpanan Berjangka" : "Penarikan Simpanan Berjangka");

        const [jurnalHeader] = await tx
          .insert(jurnal)
          .values({
            kodeTransaksi: journalCode,
            tanggalTransaksi: mutasi.tanggalTransaksi,
            keterangan: journalKet,
            userId: mutasi.userId,
          })
          .returning();

        if (!jurnalHeader) {
          throw { code: "DATABASE_ERROR", message: "Gagal membuat header jurnal" };
        }

        // Journal Details Mapping
        if (isSaham) {
          // Setor Saham:
          // Debit: Kas/Bank (mutasi.akunId) = nilaiTransaksi + agioSaham
          // Kredit: SAHAM50 (19) = nilaiTransaksi
          // Kredit: AGIOSAHAM (50) = agioSaham (if > 0)
          const totalDebit = mutasi.nilaiTransaksi + mutasi.agioSaham;
          const detailRows = [
            {
              jurnalId: jurnalHeader.id,
              akunId: mutasi.akunId,
              debit: totalDebit,
              kredit: 0,
            },
            {
              jurnalId: jurnalHeader.id,
              akunId: AkunId.SAHAM50,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ];

          if (mutasi.agioSaham > 0) {
            detailRows.push({
              jurnalId: jurnalHeader.id,
              akunId: AkunId.AGIOSAHAM,
              debit: 0,
              kredit: mutasi.agioSaham,
            });
          }

          await tx.insert(jurnalDetail).values(detailRows);
        } else if (mutasi.jenisTransaksi === "setoran") {
          // Setoran Tabungan:
          // Debit: Kas/Bank (mutasi.akunId) = nilaiTransaksi
          // Kredit: SIMPANANBERJANGKA (12) = nilaiTransaksi
          await tx.insert(jurnalDetail).values([
            {
              jurnalId: jurnalHeader.id,
              akunId: mutasi.akunId,
              debit: mutasi.nilaiTransaksi,
              kredit: 0,
            },
            {
              jurnalId: jurnalHeader.id,
              akunId: AkunId.SIMPANANBERJANGKA,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ]);
        } else {
          // Penarikan Tabungan:
          // Debit: SIMPANANBERJANGKA (12) = nilaiTransaksi
          // Kredit: Kas/Bank (mutasi.akunId) = nilaiTransaksi
          await tx.insert(jurnalDetail).values([
            {
              jurnalId: jurnalHeader.id,
              akunId: AkunId.SIMPANANBERJANGKA,
              debit: mutasi.nilaiTransaksi,
              kredit: 0,
            },
            {
              jurnalId: jurnalHeader.id,
              akunId: mutasi.akunId,
              debit: 0,
              kredit: mutasi.nilaiTransaksi,
            },
          ]);
        }

        return updatedMutasi;
      }),
      cause => (typeof cause === "object" && cause && "code" in cause ? cause as { code: string; message: string } : { code: "DATABASE_ERROR", cause }),
    );
  },

  rejectMutasi(id: number, adminId: number, alasanPenolakan: string) {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(mutasiSimpanan)
        .where(eq(mutasiSimpanan.id, id))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).andThen((rows) => {
      const mutasi = rows[0];
      if (!mutasi) {
        return ResultAsync.fromPromise(
          Promise.reject({ code: "NOT_FOUND", message: "Data mutasi simpanan tidak ditemukan" }),
          err => err as { code: string; message: string },
        );
      }

      if (mutasi.statusApproved !== "pending") {
        return ResultAsync.fromPromise(
          Promise.reject({ code: "ALREADY_PROCESSED", message: "Transaksi ini sudah diproses sebelumnya" }),
          err => err as { code: string; message: string },
        );
      }

      return ResultAsync.fromPromise(
        db
          .update(mutasiSimpanan)
          .set({
            statusApproved: "rejected",
            alasanPenolakan,
            approvedBy: adminId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(mutasiSimpanan.id, id))
          .returning(),
        cause => ({ code: "DATABASE_ERROR", cause } as const),
      ).map(res => res[0] ?? null);
    });
  },

  getPaginatedMutasi(query: GetMutasiQueryInput) {
    const offset = (query.page - 1) * query.limit;
    const conditions = [];

    if (query.userId) {
      conditions.push(eq(mutasiSimpanan.userId, query.userId));
    }
    if (query.status) {
      conditions.push(eq(mutasiSimpanan.statusApproved, query.status));
    }
    if (query.jenisTransaksi) {
      conditions.push(eq(mutasiSimpanan.jenisTransaksi, query.jenisTransaksi));
    }
    if (query.search) {
      conditions.push(ilike(mutasiSimpanan.kodeTransaksi, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const approvedUser = sql`approved_user`;

    return ResultAsync.fromPromise(
      Promise.all([
        db
          .select({
            id: mutasiSimpanan.id,
            kodeTransaksi: mutasiSimpanan.kodeTransaksi,
            userId: mutasiSimpanan.userId,
            userName: user.name,
            akunId: mutasiSimpanan.akunId,
            kodeAkun: akun.kodeAkun,
            namaAkun: akun.namaAkun,
            jenisTransaksi: mutasiSimpanan.jenisTransaksi,
            nilaiTransaksi: mutasiSimpanan.nilaiTransaksi,
            agioSaham: mutasiSimpanan.agioSaham,
            saldoSetelahTransaksi: mutasiSimpanan.saldoSetelahTransaksi,
            tanggalTransaksi: mutasiSimpanan.tanggalTransaksi,
            statusApproved: mutasiSimpanan.statusApproved,
            alasanPenolakan: mutasiSimpanan.alasanPenolakan,
            keterangan: mutasiSimpanan.keterangan,
            createdBy: mutasiSimpanan.createdBy,
            approvedBy: mutasiSimpanan.approvedBy,
            approvedAt: mutasiSimpanan.approvedAt,
            createdAt: mutasiSimpanan.createdAt,
          })
          .from(mutasiSimpanan)
          .leftJoin(user, eq(mutasiSimpanan.userId, user.id))
          .leftJoin(akun, eq(mutasiSimpanan.akunId, akun.id))
          .where(whereClause)
          .orderBy(desc(mutasiSimpanan.id))
          .limit(query.limit)
          .offset(offset),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(mutasiSimpanan)
          .where(whereClause)
          .then(rows => rows[0]?.total ?? 0),
      ]).then(([rows, total]) => {
        const formattedRows: MutasiSimpananRow[] = rows.map(r => ({
          ...r,
          approvedByName: null,
          approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
        }));

        return {
          items: formattedRows,
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        };
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
