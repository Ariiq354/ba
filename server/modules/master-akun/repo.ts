import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { DatabaseError } from "~~/server/utils/error";
import { isUniqueViolation } from "~~/server/utils/pgcode";
import { DuplicateKodeAkunError } from "./errors";

export const MasterAkunRepo = {
  create: Effect.fn("MasterAkunRepo.create")((data: CreateAkunSchema) =>
    Effect.tryPromise({
      try: async () => {
        await db.insert(akun).values(data);
      },
      catch: (error) => {
        if (isUniqueViolation(error)) {
          return new DuplicateKodeAkunError({ kodeAkun: data.kodeAkun });
        }
        return new DatabaseError({ error });
      },
    }),
  ),

  findAll: Effect.fn("MasterAkunRepo.findAll")((query: GetAkunQuerySchema) =>
    Effect.tryPromise({
      try: async () => {
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

        const qb = db
          .select({
            id: akun.id,
            kodeAkun: akun.kodeAkun,
            namaAkun: akun.namaAkun,
            kategori: akun.kategori,
            normalBalance: akun.normalBalance,
            isActive: akun.isActive,
          })
          .from(akun)
          .where(and(...conditions))
          .orderBy(asc(akun.kodeAkun));

        const offset = (query.page - 1) * query.limit;
        const total = await db.$count(qb);
        const data = await qb.limit(query.limit).offset(offset);

        return { total, data };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  update: Effect.fn("MasterAkunRepo.update")((id: number, data: UpdateAkunSchema) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .update(akun)
          .set(data)
          .where(eq(akun.id, id))
          .returning();
        return rows;
      },
      catch: (error) => {
        if (isUniqueViolation(error)) {
          return new DuplicateKodeAkunError({ kodeAkun: data.kodeAkun! });
        }
        return new DatabaseError({ error });
      },
    }),
  ),

  deleteBulk: Effect.fn("MasterAkunRepo.deleteBulk")((ids: number[]) =>
    Effect.tryPromise({
      try: async () => {
        return await db
          .delete(akun)
          .where(inArray(akun.id, ids))
          .returning();
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
