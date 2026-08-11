import type { CreateJurnalSchema, GetJurnalQuerySchema } from "./model";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
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
  generateNextKodeTransaksi() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `TRX-${yearMonth}-`;

    return ResultAsync.fromPromise(
      db
        .select({ kodeTransaksi: jurnal.kodeTransaksi })
        .from(jurnal)
        .where(ilike(jurnal.kodeTransaksi, `${prefix}%`))
        .orderBy(desc(jurnal.kodeTransaksi))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map((rows) => {
      if (!rows.length || !rows[0]?.kodeTransaksi) {
        return `${prefix}0001`;
      }
      const lastCode = rows[0].kodeTransaksi;
      const parts = lastCode.split("-");
      const seqStr = parts[parts.length - 1];
      const seqNum = Number.parseInt(seqStr || "0", 10);
      const nextSeq = String(seqNum + 1).padStart(4, "0");
      return `${prefix}${nextSeq}`;
    });
  },

  findById(id: number) {
    return ResultAsync.fromPromise(
      db
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
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).andThen((headerRows) => {
      if (!headerRows.length || !headerRows[0]) {
        return ResultAsync.fromSafePromise(Promise.resolve(null));
      }
      const headerData = headerRows[0];

      return ResultAsync.fromPromise(
        db
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
          .where(eq(jurnalDetail.jurnalId, id)),
        cause => ({ code: "DATABASE_ERROR", cause } as const),
      ).map(details => ({
        ...headerData.header,
        userName: headerData.user?.name ?? null,
        details,
      }));
    });
  },

  findByKodeTransaksi(kodeTransaksi: string) {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(jurnal)
        .where(eq(jurnal.kodeTransaksi, kodeTransaksi))
        .limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  create(data: CreateJurnalSchema, userId: number, generatedKode: string) {
    const kode = data.kodeTransaksi && data.kodeTransaksi.trim() !== ""
      ? data.kodeTransaksi.trim()
      : generatedKode;

    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
        const [header] = await tx
          .insert(jurnal)
          .values({
            kodeTransaksi: kode,
            tanggalTransaksi: data.tanggalTransaksi,
            keterangan: data.keterangan || null,
            userId,
          })
          .returning();

        if (!header) {
          throw new Error("Failed to insert jurnal header");
        }

        const detailValues = data.details.map(d => ({
          jurnalId: header.id,
          akunId: d.akunId,
          debit: Math.round(d.debit || 0),
          kredit: Math.round(d.kredit || 0),
        }));

        const details = await tx
          .insert(jurnalDetail)
          .values(detailValues)
          .returning();

        return { header, details };
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getPaginated(query: GetJurnalQuerySchema) {
    const offset = (query.page - 1) * query.limit;
    const conditions = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(ilike(jurnal.kodeTransaksi, pattern));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return ResultAsync.fromPromise(
      Promise.all([
        // Get paginated headers
        db
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
        // Get count of headers
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(jurnal)
          .where(whereClause)
          .then(rows => rows[0]?.total ?? 0),
      ]).then(async ([headers, totalHeaders]) => {
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

        const details = await db
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

        // Group details by jurnalId
        const detailsByJurnal = new Map<number, typeof details>();
        for (const detail of details) {
          if (!detailsByJurnal.has(detail.jurnalId)) {
            detailsByJurnal.set(detail.jurnalId, []);
          }
          detailsByJurnal.get(detail.jurnalId)!.push(detail);
        }

        // Flatten rows
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
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  delete(id: number) {
    return ResultAsync.fromPromise(
      db.delete(jurnal).where(eq(jurnal.id, id)).returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
