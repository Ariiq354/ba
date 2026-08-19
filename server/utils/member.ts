import { and, eq, like } from "drizzle-orm";
import { Data, Effect } from "effect";
import { db } from "../database";
import { user } from "../database/schema/auth";
import { kelompok } from "../database/schema/kelompok";
import { userProfile } from "../database/schema/users";
import { DatabaseError } from "./error";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class KelompokNotFoundError extends Data.TaggedError("KelompokNotFoundError")<{
  readonly idKelompok: number;
}> {}

/**
 * Generates member number (noAnggota) with format: {kodeKelompok}-{MMYY}-{nomor}
 * Example: KD-0826-0001
 * The 4-digit sequence number resets monthly per kelompok.
 */
export const generateNoAnggota = Effect.fn("MemberUtils.generateNoAnggota")(
  (idKelompok: number, tx: DbTransaction | typeof db = db, date: Date = new Date()) =>
    Effect.gen(function* () {
      const targetKelompok = yield* Effect.tryPromise({
        try: async () => {
          const rows = await tx
            .select({ kodeKelompok: kelompok.kodeKelompok })
            .from(kelompok)
            .where(eq(kelompok.id, idKelompok))
            .limit(1);
          return rows[0];
        },
        catch: error => new DatabaseError({ error }),
      });

      if (!targetKelompok) {
        return yield* new KelompokNotFoundError({ idKelompok });
      }

      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yy = String(date.getFullYear()).slice(-2);
      const mmyy = `${mm}${yy}`;
      const prefix = `${targetKelompok.kodeKelompok}-${mmyy}-`;
      const prefixPattern = `${prefix}%`;

      const existingProfiles = yield* Effect.tryPromise({
        try: async () => {
          return await tx
            .select({ noAnggota: userProfile.noAnggota })
            .from(userProfile)
            .innerJoin(user, eq(user.id, userProfile.idUser))
            .where(
              and(
                eq(user.idKelompok, idKelompok),
                like(userProfile.noAnggota, prefixPattern),
              ),
            );
        },
        catch: error => new DatabaseError({ error }),
      });

      let maxSeq = 0;
      for (const item of existingProfiles) {
        if (item.noAnggota) {
          const parts = item.noAnggota.split("-");
          const seqStr = parts[parts.length - 1];
          if (seqStr) {
            const seqNum = Number.parseInt(seqStr, 10);
            if (!Number.isNaN(seqNum) && seqNum > maxSeq) {
              maxSeq = seqNum;
            }
          }
        }
      }

      const nextSeq = String(maxSeq + 1).padStart(4, "0");
      return `${prefix}${nextSeq}`;
    }),
);
