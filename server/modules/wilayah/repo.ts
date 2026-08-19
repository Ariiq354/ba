import { asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { kecamatan, kelurahan, kota, provinsi } from "~~/server/database/schema/wilayah";
import { DatabaseError } from "~~/server/utils/error";

export const WilayahRepo = {
  findProvinsi: Effect.fn("WilayahRepo.findProvinsi")(() =>
    Effect.tryPromise({
      try: async () => {
        return await db.select().from(provinsi).orderBy(asc(provinsi.provinsi));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findKotaByProvinsiId: Effect.fn("WilayahRepo.findKotaByProvinsiId")((idProvinsi: string) =>
    Effect.tryPromise({
      try: async () => {
        return await db.select().from(kota).where(eq(kota.idProvinsi, idProvinsi)).orderBy(asc(kota.kota));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findKecamatanByKotaId: Effect.fn("WilayahRepo.findKecamatanByKotaId")((idKota: string) =>
    Effect.tryPromise({
      try: async () => {
        return await db.select().from(kecamatan).where(eq(kecamatan.idKota, idKota)).orderBy(asc(kecamatan.kecamatan));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findKelurahanByKecamatanId: Effect.fn("WilayahRepo.findKelurahanByKecamatanId")((idKecamatan: string) =>
    Effect.tryPromise({
      try: async () => {
        return await db.select().from(kelurahan).where(eq(kelurahan.idKecamatan, idKecamatan)).orderBy(asc(kelurahan.kelurahan));
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
