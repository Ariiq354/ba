import type { GetMutasiQueryInput } from "./model";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { user } from "~~/server/database/schema/auth";
import { jurnal, jurnalDetail } from "~~/server/database/schema/jurnal";
import { mutasiSimpanan, saldoSimpanan } from "~~/server/database/schema/simpanan";
import { DatabaseError } from "~~/server/utils/error";

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
  getLatestSahamPrice: Effect.fn("SimpananRepo.getLatestSahamPrice")(() =>
    Effect.tryPromise({
      try: async () => {
        return await db.query.saham.findFirst({
          orderBy: {
            id: "desc",
          },
        });
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getSaldo: Effect.fn("SimpananRepo.getSaldo")((userId: number) =>
    Effect.tryPromise({
      try: async () => {
        const [saldoRow, pendingRows] = await Promise.all([
          db.query.saldoSimpanan.findFirst({
            where: {
              userId,
            },
          }),
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
        ]);

        const saldoTabungan = saldoRow?.saldoTabungan ?? 0;
        const saldoSaham = saldoRow?.saldoSaham ?? 0;
        const sumPendingPenarikan = pendingRows[0]?.totalPending ?? 0;
        const effectiveSaldo = Math.max(0, saldoTabungan - sumPendingPenarikan);

        return {
          saldoTabungan,
          saldoSaham,
          sumPendingPenarikan,
          effectiveSaldo,
        };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  generateKodeTransaksi: Effect.fn("SimpananRepo.generateKodeTransaksi")((tanggalTransaksi?: string) =>
    Effect.tryPromise({
      try: async () => {
        const dateObj = tanggalTransaksi ? new Date(tanggalTransaksi) : new Date();
        const dateStr = Number.isNaN(dateObj.getTime())
          ? new Date().toISOString().substring(0, 10).replace(/-/g, "")
          : dateObj.toISOString().substring(0, 10).replace(/-/g, "");
        const prefix = `STR-${dateStr}-`;

        const lastMutasi = await db.query.mutasiSimpanan.findFirst({
          where: {
            kodeTransaksi: { ilike: `${prefix}%` },
          },
          orderBy: {
            kodeTransaksi: "desc",
          },
          columns: {
            kodeTransaksi: true,
          },
        });

        if (!lastMutasi?.kodeTransaksi) {
          return `${prefix}001`;
        }
        const lastCode = lastMutasi.kodeTransaksi;
        const parts = lastCode.split("-");
        const seqStr = parts[parts.length - 1];
        const seqNum = Number.parseInt(seqStr || "0", 10);
        const nextSeq = String(seqNum + 1).padStart(3, "0");
        return `${prefix}${nextSeq}`;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  ensureSaldoRecordTx: Effect.fn("SimpananRepo.ensureSaldoRecordTx")((userId: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        const row = await (tx as typeof db).query.saldoSimpanan.findFirst({
          where: {
            userId,
          },
        });

        if (!row) {
          await tx.insert(saldoSimpanan).values({
            userId,
            saldoTabungan: 0,
            saldoSaham: 0,
          });
        }
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  insertMutasi: Effect.fn("SimpananRepo.insertMutasi")(
    (data: typeof mutasiSimpanan.$inferInsert, tx = db) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await tx
            .insert(mutasiSimpanan)
            .values(data)
            .returning();
          return row;
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  getMutasiById: Effect.fn("SimpananRepo.getMutasiById")((id: number) =>
    Effect.tryPromise({
      try: async () => {
        return await db.query.mutasiSimpanan.findFirst({
          where: {
            id,
          },
        });
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getMutasiForUpdate: Effect.fn("SimpananRepo.getMutasiForUpdate")((id: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await tx
          .select()
          .from(mutasiSimpanan)
          .where(eq(mutasiSimpanan.id, id))
          .for("update");
        return rows[0] ?? null;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  deleteMutasi: Effect.fn("SimpananRepo.deleteMutasi")((id: number) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .delete(mutasiSimpanan)
          .where(eq(mutasiSimpanan.id, id))
          .returning();
        return rows[0] ?? null;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getSaldoRecordForUpdate: Effect.fn("SimpananRepo.getSaldoRecordForUpdate")((userId: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await tx
          .select()
          .from(saldoSimpanan)
          .where(eq(saldoSimpanan.userId, userId))
          .for("update");
        return rows[0] ?? null;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  updateSaldoRecord: Effect.fn("SimpananRepo.updateSaldoRecord")(
    (
      userId: number,
      data: { saldoTabungan?: number; saldoSaham?: number },
      tx = db,
    ) =>
      Effect.tryPromise({
        try: async () => {
          return await tx
            .update(saldoSimpanan)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(saldoSimpanan.userId, userId));
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  getOtherPendingPenarikan: Effect.fn("SimpananRepo.getOtherPendingPenarikan")(
    (userId: number, excludeMutasiId: number, tx = db) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await tx
            .select({
              totalPending: sql<number>`coalesce(sum(${mutasiSimpanan.nilaiTransaksi}), 0)::int`,
            })
            .from(mutasiSimpanan)
            .where(
              and(
                eq(mutasiSimpanan.userId, userId),
                eq(mutasiSimpanan.jenisTransaksi, "penarikan"),
                eq(mutasiSimpanan.statusApproved, "pending"),
                sql`${mutasiSimpanan.id} != ${excludeMutasiId}`,
              ),
            );
          return rows[0]?.totalPending ?? 0;
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  updateMutasiStatus: Effect.fn("SimpananRepo.updateMutasiStatus")(
    (
      id: number,
      data: Partial<typeof mutasiSimpanan.$inferInsert>,
      tx = db,
    ) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await tx
            .update(mutasiSimpanan)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(mutasiSimpanan.id, id))
            .returning();
          return row ?? null;
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  generateJournalCode: Effect.fn("SimpananRepo.generateJournalCode")((tanggalTransaksi: string, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        const dateStr = tanggalTransaksi.replace(/-/g, "");
        const prefix = `TRX-${dateStr}-`;
        const lastJurnal = await (tx as typeof db).query.jurnal.findFirst({
          where: {
            kodeTransaksi: { ilike: `${prefix}%` },
          },
          orderBy: {
            kodeTransaksi: "desc",
          },
          columns: {
            kodeTransaksi: true,
          },
        });

        if (lastJurnal?.kodeTransaksi) {
          const parts = lastJurnal.kodeTransaksi.split("-");
          const seqNum = Number.parseInt(parts[parts.length - 1] || "0", 10);
          return `${prefix}${String(seqNum + 1).padStart(3, "0")}`;
        }
        return `${prefix}001`;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  createJurnalWithDetails: Effect.fn("SimpananRepo.createJurnalWithDetails")(
    (
      headerData: {
        kodeTransaksi: string;
        tanggalTransaksi: string;
        keterangan: string;
        userId: number;
      },
      details: Omit<typeof jurnalDetail.$inferInsert, "jurnalId">[],
      tx = db,
    ) =>
      Effect.tryPromise({
        try: async () => {
          const [header] = await tx
            .insert(jurnal)
            .values(headerData)
            .returning();

          if (!header) {
            throw new Error("Gagal membuat header jurnal");
          }

          const detailRowsWithHeaderId = details.map(d => ({
            ...d,
            jurnalId: header.id,
          }));

          await tx.insert(jurnalDetail).values(detailRowsWithHeaderId);
          return header;
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  findAll: Effect.fn("SimpananRepo.findAll")((query: GetMutasiQueryInput) =>
    Effect.tryPromise({
      try: async () => {
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

        const [rows, totalRows] = await Promise.all([
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
            .where(whereClause),
        ]);

        const total = totalRows[0]?.total ?? 0;

        const formattedRows: MutasiSimpananRow[] = rows.map(r => ({
          ...r,
          approvedByName: null,
          approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
        }));

        return {
          total,
          data: formattedRows,
        };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
