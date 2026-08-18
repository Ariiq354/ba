import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { DatabaseError, DeleteAkunError } from "./errors";

export const MasterAkunRepo = {
  findByKodeAkun: Effect.fn("MasterAkunRepo.findByKodeAkun")((kodeAkun: string) =>
    Effect.tryPromise({
      try: async () => {
        const item = await db.query.akun.findFirst({
          where: { kodeAkun },
        });
        return item ?? null;
      },
      catch: cause => new DatabaseError({ message: "Gagal mencari data kode akun", cause }),
    }),
  ),

  findById: Effect.fn("MasterAkunRepo.findById")((id: number) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(akun).where(eq(akun.id, id)).limit(1);
        return rows[0] ?? null;
      },
      catch: cause => new DatabaseError({ message: `Gagal mencari akun ID ${id}`, cause }),
    }),
  ),

  create: Effect.fn("MasterAkunRepo.create")((data: CreateAkunSchema) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db.insert(akun).values(data).returning();
        return rows[0];
      },
      catch: cause => new DatabaseError({ message: "Gagal menambahkan akun ke database", cause }),
    }),
  ),

  getPaginated: Effect.fn("MasterAkunRepo.getPaginated")((query: GetAkunQuerySchema) =>
    Effect.tryPromise({
      try: async () => {
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
      catch: cause => new DatabaseError({ message: "Gagal mengambil daftar akun", cause }),
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
        return rows[0] ?? null;
      },
      catch: cause => new DatabaseError({ message: `Gagal memperbarui akun ID ${id}`, cause }),
    }),
  ),

  deleteBulk: Effect.fn("MasterAkunRepo.deleteBulk")((ids: number[]) =>
    Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) {
          return [];
        }
        return await db
          .delete(akun)
          .where(inArray(akun.id, ids))
          .returning();
      },
      catch: cause =>
        new DeleteAkunError({
          ids,
          message: "Gagal menghapus data akun (kemungkinan sedang digunakan dalam transaksi)",
          cause,
        }),
    }),
  ),
};
