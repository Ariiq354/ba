import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateSahamSchema } from "./model";
import { desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { saham } from "~~/server/database/schema/master";
import { DatabaseError } from "~~/server/utils/error";

export const MasterSahamRepo = {
  create: Effect.fn("MasterSahamRepo.create")((userId: number, data: CreateSahamSchema) =>
    Effect.tryPromise({
      try: async () => {
        await db.insert(saham).values({
          hargaNominal: data.hargaNominal,
          hargaJual: data.hargaJual,
          updatedBy: userId,
        });
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getLatest: Effect.fn("MasterSahamRepo.getLatest")(() =>
    Effect.tryPromise({
      try: async () => {
        return await db.query.saham.findFirst({
          orderBy: {
            createdAt: "desc",
            id: "desc",
          },
          with: {
            updater: {
              columns: {
                name: true,
              },
            },
          },
        });
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findAll: Effect.fn("MasterSahamRepo.findAll")((query: PaginationSchema) =>
    Effect.tryPromise({
      try: async () => {
        const qb = db
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
          .orderBy(desc(saham.createdAt), desc(saham.id));

        const offset = (query.page - 1) * query.limit;
        const total = await db.$count(qb);
        const data = await qb.limit(query.limit).offset(offset);

        return { total, data };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
