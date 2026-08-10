import type { z } from "zod";
import type { createMarginSchema, marginQuerySchema, updateMarginSchema } from "./model";
import { count, desc, eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { margin } from "~~/server/database/schema/master";

export const MasterMarginRepo = {
  create(data: z.infer<typeof createMarginSchema>) {
    return ResultAsync.fromPromise(
      db.insert(margin).values(data).returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0]);
  },

  getById(id: number) {
    return ResultAsync.fromPromise(
      db
        .select()
        .from(margin)
        .where(eq(margin.id, id))
        .limit(1)
        .then(rows => rows[0] ?? null),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getPaginated(query: z.infer<typeof marginQuerySchema>) {
    const offset = (query.page - 1) * query.limit;

    return ResultAsync.fromPromise(
      Promise.all([
        db
          .select()
          .from(margin)
          .orderBy(desc(margin.createdAt), desc(margin.id))
          .limit(query.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(margin)
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

  update(id: number, data: z.infer<typeof updateMarginSchema>) {
    return ResultAsync.fromPromise(
      db
        .update(margin)
        .set(data)
        .where(eq(margin.id, id))
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },

  delete(id: number) {
    return ResultAsync.fromPromise(
      db
        .delete(margin)
        .where(eq(margin.id, id))
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0] ?? null);
  },
};
