import type { DbClient } from "~~/server/database";
import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "~~/server/database";
import { margin } from "~~/server/database/schema/master";

export const MasterMarginRepo = {
  async findById(id: number, client: DbClient = db) {
    const rows = await client.select().from(margin).where(eq(margin.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(data: CreateMarginSchema, client: DbClient = db) {
    const rows = await client.insert(margin).values(data).returning();
    return rows[0];
  },

  async getPaginated(query: PaginationSchema, client: DbClient = db) {
    const offset = (query.page - 1) * query.limit;

    const [items, totalRows] = await Promise.all([
      client
        .select()
        .from(margin)
        .orderBy(desc(margin.createdAt), desc(margin.id))
        .limit(query.limit)
        .offset(offset),
      client
        .select({ total: count() })
        .from(margin),
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

  async update(id: number, data: UpdateMarginSchema, client: DbClient = db) {
    const rows = await client
      .update(margin)
      .set(data)
      .where(eq(margin.id, id))
      .returning();
    return rows[0] ?? null;
  },

  async deleteBulk(ids: number[], client: DbClient = db) {
    if (ids.length === 0) {
      return [];
    }

    return await client
      .delete(margin)
      .where(inArray(margin.id, ids))
      .returning();
  },
};
