import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";

export const MasterAkunRepo = {
  findByKodeAkun(kodeAkun: string) {
    return ResultAsync.fromPromise(
      db.select().from(akun).where(eq(akun.kodeAkun, kodeAkun)).limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  findById(id: number) {
    return ResultAsync.fromPromise(
      db.select().from(akun).where(eq(akun.id, id)).limit(1),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  create(data: CreateAkunSchema) {
    return ResultAsync.fromPromise(
      db.insert(akun).values(data).returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0]);
  },

  getPaginated(query: GetAkunQuerySchema) {
    const offset = (query.page - 1) * query.limit;
    const conditions = [];

    if (query.kategori && query.kategori !== "all") {
      conditions.push(eq(akun.kategori, query.kategori));
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(akun.kodeAkun, searchPattern),
          ilike(akun.namaAkun, searchPattern),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return ResultAsync.fromPromise(
      Promise.all([
        db
          .select()
          .from(akun)
          .where(whereClause)
          .orderBy(asc(akun.kodeAkun))
          .limit(query.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(akun)
          .where(whereClause)
          .then(rows => rows[0]?.total ?? 0),
      ]).then(([items, total]) => ({
        items,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      })),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  update(id: number, data: UpdateAkunSchema) {
    return ResultAsync.fromPromise(
      db
        .update(akun)
        .set(data)
        .where(eq(akun.id, id))
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  deleteBulk(ids: number[]) {
    if (ids.length === 0) {
      return ResultAsync.fromSafePromise(Promise.resolve([]));
    }

    return ResultAsync.fromPromise(
      db
        .delete(akun)
        .where(inArray(akun.id, ids))
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
