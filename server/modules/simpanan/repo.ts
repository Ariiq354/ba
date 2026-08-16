import type { DbClient } from "~~/server/database";
import type {
  GetMutasiQueryInput,
} from "./model";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { user } from "~~/server/database/schema/auth";
import { jurnal, jurnalDetail } from "~~/server/database/schema/jurnal";
import { saham } from "~~/server/database/schema/master";
import { mutasiSimpanan, saldoSimpanan } from "~~/server/database/schema/simpanan";

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
  async getLatestSahamPrice(client: DbClient = db) {
    const rows = await client
      .select()
      .from(saham)
      .orderBy(desc(saham.id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getSaldo(userId: number, client: DbClient = db): Promise<SaldoInfo> {
    const [saldoRows, pendingRows] = await Promise.all([
      client
        .select()
        .from(saldoSimpanan)
        .where(eq(saldoSimpanan.userId, userId))
        .limit(1),
      client
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
  },

  async generateKodeTransaksi(tanggalTransaksi?: string, client: DbClient = db) {
    const dateObj = tanggalTransaksi ? new Date(tanggalTransaksi) : new Date();
    const dateStr = Number.isNaN(dateObj.getTime())
      ? new Date().toISOString().substring(0, 10).replace(/-/g, "")
      : dateObj.toISOString().substring(0, 10).replace(/-/g, "");
    const prefix = `STR-${dateStr}-`;

    const rows = await client
      .select({ kodeTransaksi: mutasiSimpanan.kodeTransaksi })
      .from(mutasiSimpanan)
      .where(ilike(mutasiSimpanan.kodeTransaksi, `${prefix}%`))
      .orderBy(desc(mutasiSimpanan.kodeTransaksi))
      .limit(1);

    if (!rows.length || !rows[0]?.kodeTransaksi) {
      return `${prefix}001`;
    }
    const lastCode = rows[0].kodeTransaksi;
    const parts = lastCode.split("-");
    const seqStr = parts[parts.length - 1];
    const seqNum = Number.parseInt(seqStr || "0", 10);
    const nextSeq = String(seqNum + 1).padStart(3, "0");
    return `${prefix}${nextSeq}`;
  },

  async ensureSaldoRecordTx(client: DbClient, userId: number) {
    const rows = await client
      .select()
      .from(saldoSimpanan)
      .where(eq(saldoSimpanan.userId, userId))
      .limit(1);

    if (!rows.length) {
      await client.insert(saldoSimpanan).values({
        userId,
        saldoTabungan: 0,
        saldoSaham: 0,
      });
    }
  },

  async insertMutasi(data: typeof mutasiSimpanan.$inferInsert, client: DbClient = db) {
    const [row] = await client
      .insert(mutasiSimpanan)
      .values(data)
      .returning();
    return row;
  },

  async getMutasiById(id: number, client: DbClient = db) {
    const rows = await client
      .select()
      .from(mutasiSimpanan)
      .where(eq(mutasiSimpanan.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getMutasiForUpdate(id: number, client: DbClient = db) {
    const rows = await client
      .select()
      .from(mutasiSimpanan)
      .where(eq(mutasiSimpanan.id, id))
      .for("update");
    return rows[0] ?? null;
  },

  async deleteMutasi(id: number, client: DbClient = db) {
    const rows = await client
      .delete(mutasiSimpanan)
      .where(eq(mutasiSimpanan.id, id))
      .returning();
    return rows[0] ?? null;
  },

  async getSaldoRecordForUpdate(userId: number, client: DbClient = db) {
    const rows = await client
      .select()
      .from(saldoSimpanan)
      .where(eq(saldoSimpanan.userId, userId))
      .for("update");
    return rows[0] ?? null;
  },

  async updateSaldoRecord(
    userId: number,
    data: { saldoTabungan?: number; saldoSaham?: number },
    client: DbClient = db,
  ) {
    return await client
      .update(saldoSimpanan)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(saldoSimpanan.userId, userId));
  },

  async getOtherPendingPenarikan(userId: number, excludeMutasiId: number, client: DbClient = db) {
    const rows = await client
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

  async updateMutasiStatus(
    id: number,
    data: Partial<typeof mutasiSimpanan.$inferInsert>,
    client: DbClient = db,
  ) {
    const [row] = await client
      .update(mutasiSimpanan)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mutasiSimpanan.id, id))
      .returning();
    return row ?? null;
  },

  async generateJournalCode(tanggalTransaksi: string, client: DbClient = db) {
    const dateStr = tanggalTransaksi.replace(/-/g, "");
    const prefix = `TRX-${dateStr}-`;
    const lastJurnalRows = await client
      .select({ kodeTransaksi: jurnal.kodeTransaksi })
      .from(jurnal)
      .where(ilike(jurnal.kodeTransaksi, `${prefix}%`))
      .orderBy(desc(jurnal.kodeTransaksi))
      .limit(1);

    if (lastJurnalRows.length && lastJurnalRows[0]?.kodeTransaksi) {
      const parts = lastJurnalRows[0].kodeTransaksi.split("-");
      const seqNum = Number.parseInt(parts[parts.length - 1] || "0", 10);
      return `${prefix}${String(seqNum + 1).padStart(3, "0")}`;
    }
    return `${prefix}001`;
  },

  async createJurnalWithDetails(
    headerData: {
      kodeTransaksi: string;
      tanggalTransaksi: string;
      keterangan: string;
      userId: number;
    },
    details: Omit<typeof jurnalDetail.$inferInsert, "jurnalId">[],
    client: DbClient = db,
  ) {
    const [header] = await client
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

    await client.insert(jurnalDetail).values(detailRowsWithHeaderId);
    return header;
  },

  async getPaginatedMutasi(query: GetMutasiQueryInput, client: DbClient = db) {
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
      client
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
      client
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
      items: formattedRows,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },
};
