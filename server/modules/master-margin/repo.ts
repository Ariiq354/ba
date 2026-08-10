import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { count, desc, eq, inArray } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { margin } from "~~/server/database/schema/master";

export const MasterMarginRepo = {
  create(data: CreateMarginSchema) {
    return ResultAsync.fromPromise(
      db.insert(margin).values(data).returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0]);
  },

  getPaginated(query: PaginationSchema) {
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

  update(id: number, data: UpdateMarginSchema) {
    return ResultAsync.fromPromise(
      db
        .update(margin)
        .set(data)
        .where(eq(margin.id, id))
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
        .delete(margin)
        .where(inArray(margin.id, ids))
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
