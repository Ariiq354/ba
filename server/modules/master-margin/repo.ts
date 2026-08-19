import type { PaginationSchema } from "~~/server/utils/schema";
import type { CreateMarginSchema, UpdateMarginSchema } from "./model";
import { desc, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { margin } from "~~/server/database/schema/master";
import { DatabaseError } from "~~/server/utils/error";

export const MasterMarginRepo = {
  create: Effect.fn("MasterMarginRepo.create")((data: CreateMarginSchema) =>
    Effect.tryPromise({
      try: async () => {
        await db.insert(margin).values(data);
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findAll: Effect.fn("MasterMarginRepo.findAll")((query: PaginationSchema) =>
    Effect.tryPromise({
      try: async () => {
        const qb = db
          .select()
          .from(margin)
          .orderBy(desc(margin.createdAt), desc(margin.id));

        const offset = (query.page - 1) * query.limit;
        const total = await db.$count(qb);
        const data = await qb.limit(query.limit).offset(offset);

        return { total, data };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  update: Effect.fn("MasterMarginRepo.update")((id: number, data: UpdateMarginSchema) =>
    Effect.tryPromise({
      try: async () => {
        return await db
          .update(margin)
          .set(data)
          .where(eq(margin.id, id))
          .returning();
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  deleteBulk: Effect.fn("MasterMarginRepo.deleteBulk")((ids: number[]) =>
    Effect.tryPromise({
      try: async () => {
        return await db
          .delete(margin)
          .where(inArray(margin.id, ids))
          .returning();
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
