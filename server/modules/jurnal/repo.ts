import type { DbClient } from "~~/server/database";
import type { GetJurnalQuerySchema } from "./model";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { user } from "~~/server/database/schema/auth";
import { jurnal, jurnalDetail } from "~~/server/database/schema/jurnal";

export interface FlatJurnalDetailRow {
  id: number; // detail id
  jurnalId: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  keterangan: string | null;
  userId: number;
  userName: string | null;
  akunId: number;
  kodeAkun: string;
  namaAkun: string;
  debit: number;
  kredit: number;
  createdAt: string;
  totalDetailsCount: number; // total detail rows in this transaction header
}

export const JurnalRepo = {
  async generateNextKodeTransaksi(tanggalTransaksi?: string, client: DbClient = db) {
    const dateObj = tanggalTransaksi ? new Date(tanggalTransaksi) : new Date();
    const dateStr = Number.isNaN(dateObj.getTime())
      ? new Date().toISOString().substring(0, 10).replace(/-/g, "")
      : dateObj.toISOString().substring(0, 10).replace(/-/g, "");
    const prefix = `TRX-${dateStr}-`;

    const rows = await client
      .select({ kodeTransaksi: jurnal.kodeTransaksi })
      .from(jurnal)
      .where(ilike(jurnal.kodeTransaksi, `${prefix}%`))
      .orderBy(desc(jurnal.kodeTransaksi))
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

  async findById(id: number, client: DbClient = db) {
    const headerRows = await client
      .select({
        header: jurnal,
        user: {
          id: user.id,
          name: user.name,
        },
      })
      .from(jurnal)
      .leftJoin(user, eq(jurnal.userId, user.id))
      .where(eq(jurnal.id, id))
      .limit(1);

    if (!headerRows.length || !headerRows[0]) {
      return null;
    }
    const headerData = headerRows[0];

    const details = await client
      .select({
        id: jurnalDetail.id,
        jurnalId: jurnalDetail.jurnalId,
        akunId: jurnalDetail.akunId,
        kodeAkun: akun.kodeAkun,
        namaAkun: akun.namaAkun,
        debit: jurnalDetail.debit,
        kredit: jurnalDetail.kredit,
      })
      .from(jurnalDetail)
      .innerJoin(akun, eq(jurnalDetail.akunId, akun.id))
      .where(eq(jurnalDetail.jurnalId, id));

    return {
      ...headerData.header,
      userName: headerData.user?.name ?? null,
      details,
    };
  },

  async findByKodeTransaksi(kodeTransaksi: string, client: DbClient = db) {
    const rows = await client
      .select()
      .from(jurnal)
      .where(eq(jurnal.kodeTransaksi, kodeTransaksi))
      .limit(1);
    return rows[0] ?? null;
  },

  async createHeader(
    data: { kodeTransaksi: string; tanggalTransaksi: string; keterangan: string | null; userId: number },
    client: DbClient = db,
  ) {
    const [header] = await client
      .insert(jurnal)
      .values(data)
      .returning();
    return header;
  },

  async insertDetails(
    details: (typeof jurnalDetail.$inferInsert)[],
    client: DbClient = db,
  ) {
    return await client
      .insert(jurnalDetail)
      .values(details)
      .returning();
  },

  async getPaginated(query: GetJurnalQuerySchema, client: DbClient = db) {
    const offset = (query.page - 1) * query.limit;
    const conditions = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(ilike(jurnal.kodeTransaksi, pattern));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [headers, totalRows] = await Promise.all([
      client
        .select({
          id: jurnal.id,
          kodeTransaksi: jurnal.kodeTransaksi,
          tanggalTransaksi: jurnal.tanggalTransaksi,
          keterangan: jurnal.keterangan,
          userId: jurnal.userId,
          userName: user.name,
          createdAt: jurnal.createdAt,
        })
        .from(jurnal)
        .leftJoin(user, eq(jurnal.userId, user.id))
        .where(whereClause)
        .orderBy(desc(jurnal.tanggalTransaksi), desc(jurnal.id))
        .limit(query.limit)
        .offset(offset),
      client
        .select({ total: sql<number>`count(*)::int` })
        .from(jurnal)
        .where(whereClause),
    ]);

    const totalHeaders = totalRows[0]?.total ?? 0;

    if (!headers.length) {
      return {
        items: [] as FlatJurnalDetailRow[],
        total: 0,
        totalHeaders: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
      };
    }

    const jurnalIds = headers.map(h => h.id);

    const details = await client
      .select({
        id: jurnalDetail.id,
        jurnalId: jurnalDetail.jurnalId,
        akunId: jurnalDetail.akunId,
        kodeAkun: akun.kodeAkun,
        namaAkun: akun.namaAkun,
        debit: jurnalDetail.debit,
        kredit: jurnalDetail.kredit,
      })
      .from(jurnalDetail)
      .innerJoin(akun, eq(jurnalDetail.akunId, akun.id))
      .where(inArray(jurnalDetail.jurnalId, jurnalIds))
      .orderBy(jurnalDetail.id);

    const detailsByJurnal = new Map<number, typeof details>();
    for (const detail of details) {
      if (!detailsByJurnal.has(detail.jurnalId)) {
        detailsByJurnal.set(detail.jurnalId, []);
      }
      detailsByJurnal.get(detail.jurnalId)!.push(detail);
    }

    const flatRows: FlatJurnalDetailRow[] = [];
    for (const h of headers) {
      const headerDetails = detailsByJurnal.get(h.id) || [];
      for (const d of headerDetails) {
        flatRows.push({
          id: d.id,
          jurnalId: h.id,
          kodeTransaksi: h.kodeTransaksi,
          tanggalTransaksi: String(h.tanggalTransaksi),
          keterangan: h.keterangan,
          userId: h.userId,
          userName: h.userName,
          akunId: d.akunId,
          kodeAkun: d.kodeAkun,
          namaAkun: d.namaAkun,
          debit: Number(d.debit),
          kredit: Number(d.kredit),
          createdAt: h.createdAt.toISOString(),
          totalDetailsCount: headerDetails.length,
        });
      }
    }

    return {
      items: flatRows,
      total: flatRows.length,
      totalHeaders,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalHeaders / query.limit),
    };
  },

  async delete(id: number, client: DbClient = db) {
    return await client.delete(jurnal).where(eq(jurnal.id, id)).returning();
  },

  async deleteBulk(ids: number[], client: DbClient = db) {
    if (ids.length === 0)
      return [];
    return await client.delete(jurnal).where(inArray(jurnal.id, ids)).returning();
  },
};
