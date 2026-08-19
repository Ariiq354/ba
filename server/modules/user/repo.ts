import type { CreateUserProfileSchema, GetUsersQuerySchema } from "./model";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { files } from "~~/server/database/schema/files";
import { kelompok, kelompokPenanggungJawab } from "~~/server/database/schema/kelompok";
import { userProfile } from "~~/server/database/schema/users";
import { DatabaseError } from "~~/server/utils/error";

export const UserRepo = {
  findById: Effect.fn("UserRepo.findById")((userId: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await tx
          .select({
            id: user.id,
            role: user.role,
            banned: user.banned,
            idKelompok: user.idKelompok,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);
        return rows[0] ?? null;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  getProfile: Effect.fn("UserRepo.getProfile")((userId: number) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            noAnggota: userProfile.noAnggota,
            noHp: userProfile.noHp,
            nik: userProfile.nik,
            namaBank: userProfile.namaBank,
            noRekening: userProfile.noRekening,
            pemilikRekening: userProfile.pemilikRekening,
            jalan: userProfile.jalan,
            idProvinsi: userProfile.idProvinsi,
            idKota: userProfile.idKota,
            idKecamatan: userProfile.idKecamatan,
            idKelurahan: userProfile.idKelurahan,
          })
          .from(user)
          .leftJoin(userProfile, eq(userProfile.idUser, user.id))
          .where(eq(user.id, userId))
          .limit(1);
        return rows[0] ?? null;
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  updateUserProfile: Effect.fn("UserRepo.updateUserProfile")(
    (userId: number, oldImage: string | null | undefined, data: CreateUserProfileSchema, tx = db) =>
      Effect.tryPromise({
        try: async () => {
          let finalImage: string | null | undefined = oldImage;

          switch (data.imageAction) {
            case "keep":
              finalImage = oldImage;
              break;
            case "remove":
              finalImage = null;
              if (oldImage) {
                await tx.delete(files).where(eq(files.publicId, oldImage));
              }
              break;
            case "update":
              finalImage = data.image ?? null;
              if (data.image) {
                await tx
                  .update(files)
                  .set({ status: "success" })
                  .where(eq(files.publicId, data.image));
              }
              if (oldImage && oldImage !== data.image) {
                await tx.delete(files).where(eq(files.publicId, oldImage));
              }
              break;
          }

          await tx
            .update(user)
            .set({
              name: data.name,
              image: finalImage,
            })
            .where(eq(user.id, userId));

          const profileData = {
            idUser: userId,
            noHp: data.noHp,
            nik: data.nik,
            namaBank: data.namaBank,
            noRekening: data.noRekening,
            pemilikRekening: data.pemilikRekening,
            jalan: data.jalan,
            idProvinsi: data.idProvinsi,
            idKota: data.idKota,
            idKecamatan: data.idKecamatan,
            idKelurahan: data.idKelurahan,
          };

          await tx
            .insert(userProfile)
            .values(profileData)
            .onConflictDoUpdate({
              target: userProfile.idUser,
              set: profileData,
            });
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  unbanUserAndSetNoAnggota: Effect.fn("UserRepo.unbanUserAndSetNoAnggota")(
    (userId: number, noAnggota: string, tx = db) =>
      Effect.tryPromise({
        try: async () => {
          await tx
            .update(user)
            .set({
              banned: false,
              banReason: null,
              banExpires: null,
            })
            .where(eq(user.id, userId));

          await tx
            .insert(userProfile)
            .values({
              idUser: userId,
              noAnggota,
            })
            .onConflictDoUpdate({
              target: userProfile.idUser,
              set: { noAnggota },
            });
        },
        catch: error => new DatabaseError({ error }),
      }),
  ),

  assignPj: Effect.fn("UserRepo.assignPj")((kelompokId: number, userId: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        await tx
          .update(user)
          .set({ role: "pj" })
          .where(eq(user.id, userId));

        await tx
          .insert(kelompokPenanggungJawab)
          .values({
            kelompokId,
            userId,
          })
          .onConflictDoNothing();
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  revokePj: Effect.fn("UserRepo.revokePj")((kelompokId: number, userId: number, tx = db) =>
    Effect.tryPromise({
      try: async () => {
        await tx
          .update(user)
          .set({ role: "user" })
          .where(eq(user.id, userId));

        await tx
          .delete(kelompokPenanggungJawab)
          .where(
            and(
              eq(kelompokPenanggungJawab.kelompokId, kelompokId),
              eq(kelompokPenanggungJawab.userId, userId),
            ),
          );
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),

  findAll: Effect.fn("UserRepo.findAll")((query: GetUsersQuerySchema) =>
    Effect.tryPromise({
      try: async () => {
        const conditions = [];

        if (query.status === "pending") {
          conditions.push(eq(user.banned, true));
        }
        else if (query.status === "verified") {
          conditions.push(or(eq(user.banned, false), isNull(user.banned)));
        }

        if (query.search) {
          const searchPattern = `%${query.search}%`;
          conditions.push(
            or(
              ilike(user.name, searchPattern),
              ilike(user.email, searchPattern),
              ilike(userProfile.noAnggota, searchPattern),
            ),
          );
        }

        const qb = db
          .select({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            banned: user.banned,
            banReason: user.banReason,
            idKelompok: user.idKelompok,
            namaKelompok: kelompok.namaKelompok,
            kodeKelompok: kelompok.kodeKelompok,
            noAnggota: userProfile.noAnggota,
            createdAt: user.createdAt,
          })
          .from(user)
          .leftJoin(userProfile, eq(userProfile.idUser, user.id))
          .leftJoin(kelompok, eq(kelompok.id, user.idKelompok))
          .where(and(...conditions))
          .orderBy(desc(user.createdAt), desc(user.id));

        const offset = (query.page - 1) * query.limit;
        const total = await db.$count(qb);
        const data = await qb.limit(query.limit).offset(offset);

        return { total, data };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
