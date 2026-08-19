import { asc } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { kelompok } from "~~/server/database/schema/kelompok";
import { DatabaseError } from "~~/server/utils/error";

export const KelompokRepo = {
  findAll: Effect.fn("KelompokRepo.findAll")(() =>
    Effect.tryPromise({
      try: async () => {
        return await db.select().from(kelompok).orderBy(asc(kelompok.namaKelompok));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
