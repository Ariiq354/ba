import type { DbClient } from "~~/server/database";
import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";

export const MasterAkunRepo = {
  async findByKodeAkun(kodeAkun: string, client: DbClient = db) {
    const rows = await client.select().from(akun).where(eq(akun.kodeAkun, kodeAkun)).limit(1);
    return rows[0] ?? null;
  },

  async findById(id: number, client: DbClient = db) {
    const rows = await client.select().from(akun).where(eq(akun.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(data: CreateAkunSchema, client: DbClient = db) {
    const rows = await client.insert(akun).values(data).returning();
    return rows[0];
  },

  async getPaginated(query: GetAkunQuerySchema, client: DbClient = db) {
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

    const [items, totalRows] = await Promise.all([
      client
        .select()
        .from(akun)
        .where(whereClause)
        .orderBy(asc(akun.kodeAkun))
        .limit(query.limit)
        .offset(offset),
      client
        .select({ total: count() })
        .from(akun)
        .where(whereClause),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async update(id: number, data: UpdateAkunSchema, client: DbClient = db) {
    const rows = await client
      .update(akun)
      .set(data)
      .where(eq(akun.id, id))
      .returning();
    return rows[0] ?? null;
  },

  async deleteBulk(ids: number[], client: DbClient = db) {
    if (ids.length === 0) {
      return [];
    }

    return await client
      .delete(akun)
      .where(inArray(akun.id, ids))
      .returning();
  },
};
