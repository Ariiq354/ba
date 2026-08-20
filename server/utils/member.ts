import type { db } from "../database";
import { and, eq, like } from "drizzle-orm";
import { user } from "../database/schema/auth";
import { kelompok } from "../database/schema/kelompok";
import { userProfile } from "../database/schema/users";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class KelompokNotFoundException extends Error {
  constructor(public readonly idKelompok: number) {
    super(`Kelompok with id ${idKelompok} not found`);
    this.name = "KelompokNotFoundException";
  }
}

/**
 * Generates member number (noAnggota) with format: {kodeKelompok}-{MMYY}-{nomor}
 * Example: KD-0826-0001
 * The 4-digit sequence number resets monthly per kelompok.
 */
export async function generateNoAnggota(
  tx: DbTransaction | typeof db,
  idKelompok: number,
  date: Date = new Date(),
): Promise<string> {
  const targetKelompok = await tx
    .select({ kodeKelompok: kelompok.kodeKelompok })
    .from(kelompok)
    .where(eq(kelompok.id, idKelompok))
    .limit(1)
    .then(rows => rows[0]);

  if (!targetKelompok) {
    throw new KelompokNotFoundException(idKelompok);
  }

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const mmyy = `${mm}${yy}`;
  const prefix = `${targetKelompok.kodeKelompok}-${mmyy}-`;
  const prefixPattern = `${prefix}%`;

  const existingProfiles = await tx
    .select({ noAnggota: userProfile.noAnggota })
    .from(userProfile)
    .innerJoin(user, eq(user.id, userProfile.idUser))
    .where(
      and(
        eq(user.idKelompok, idKelompok),
        like(userProfile.noAnggota, prefixPattern),
      ),
    );

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
}
