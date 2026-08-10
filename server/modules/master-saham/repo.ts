import type { z } from "zod";
import type { createSahamSchema, sahamQuerySchema } from "./model";
import { count, desc, eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { saham } from "~~/server/database/schema/master";

export const MasterSahamRepo = {
  create(userId: number, data: z.infer<typeof createSahamSchema>) {
    return ResultAsync.fromPromise(
      db
        .insert(saham)
        .values({
          hargaNominal: data.hargaNominal,
          hargaJual: data.hargaJual,
          updatedBy: userId,
        })
        .returning(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).map(rows => rows[0]);
  },

  getLatest() {
    return ResultAsync.fromPromise(
      db
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
        .limit(1)
        .then(rows => rows[0] ?? null),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getPaginated(query: z.infer<typeof sahamQuerySchema>) {
    const offset = (query.page - 1) * query.limit;

    return ResultAsync.fromPromise(
      Promise.all([
        db
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
        db
          .select({ total: count() })
          .from(saham)
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
};
