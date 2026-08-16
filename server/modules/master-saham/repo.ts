import type { DbClient } from "~~/server/database";
import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateSahamSchema } from "./model";
import { count, desc, eq } from "drizzle-orm";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { saham } from "~~/server/database/schema/master";

export const MasterSahamRepo = {
  async create(userId: number, data: CreateSahamSchema, client: DbClient = db) {
    const rows = await client
      .insert(saham)
      .values({
        hargaNominal: data.hargaNominal,
        hargaJual: data.hargaJual,
        updatedBy: userId,
      })
      .returning();
    return rows[0];
  },

  async getLatest(client: DbClient = db) {
    const rows = await client
      .select({
        id: saham.id,
        hargaNominal: saham.hargaNominal,
        hargaJual: saham.hargaJual,
        updatedBy: saham.updatedBy,
        createdAt: saham.createdAt,
        updatedByName: user.name,
      })
      .from(saham)
      .leftJoin(user, eq(user.id, saham.updatedBy))
      .orderBy(desc(saham.createdAt), desc(saham.id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getPaginated(query: PaginationSchema, client: DbClient = db) {
    const offset = (query.page - 1) * query.limit;

    const [items, totalRows] = await Promise.all([
      client
        .select({
          id: saham.id,
          hargaNominal: saham.hargaNominal,
          hargaJual: saham.hargaJual,
          updatedBy: saham.updatedBy,
          createdAt: saham.createdAt,
          updatedByName: user.name,
        })
        .from(saham)
        .leftJoin(user, eq(user.id, saham.updatedBy))
        .orderBy(desc(saham.createdAt), desc(saham.id))
        .limit(query.limit)
        .offset(offset),
      client
        .select({ total: count() })
        .from(saham),
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
};
