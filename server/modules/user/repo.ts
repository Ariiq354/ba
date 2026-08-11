import type { CreateUserProfileSchema, GetUsersQuerySchema } from "./model";
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { files } from "~~/server/database/schema/files";
import { kelompok, kelompokPenanggungJawab } from "~~/server/database/schema/kelompok";
import { userProfile } from "~~/server/database/schema/users";
import { generateNoAnggota } from "~~/server/utils/member";

export const UserRepo = {
  updateUserProfile(
    userId: number,
    oldImage: string | null | undefined,
    data: CreateUserProfileSchema,
  ) {
    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
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
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  getUserProfile(userId: number) {
    return ResultAsync.fromPromise(
      db
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
        .limit(1)
        .then(rows => rows[0] ?? null),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },

  verifyUser(userId: number) {
    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
        const targetUser = await tx
          .select({
            id: user.id,
            banned: user.banned,
            idKelompok: user.idKelompok,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)
          .then(rows => rows[0] ?? null);

        if (!targetUser) {
          return { status: "NOT_FOUND" } as const;
        }

        if (!targetUser.banned) {
          return { status: "ALREADY_VERIFIED" } as const;
        }

        const noAnggota = await generateNoAnggota(tx, targetUser.idKelompok);

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

        return { status: "SUCCESS", noAnggota } as const;
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).andThen((res) => {
      if (res.status === "NOT_FOUND") {
        return errAsync({
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        } as const);
      }
      if (res.status === "ALREADY_VERIFIED") {
        return errAsync({
          code: "ALREADY_VERIFIED",
          message: "User sudah terverifikasi",
        } as const);
      }
      return okAsync({ noAnggota: res.noAnggota });
    });
  },

  setUserPj(userId: number, isPj: boolean) {
    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
        const targetUser = await tx
          .select({
            id: user.id,
            role: user.role,
            banned: user.banned,
            idKelompok: user.idKelompok,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)
          .then(rows => rows[0] ?? null);

        if (!targetUser) {
          return { status: "NOT_FOUND" } as const;
        }

        if (targetUser.role === "admin") {
          return { status: "ADMIN_USER" } as const;
        }

        if (targetUser.banned) {
          return { status: "NOT_VERIFIED" } as const;
        }

        if (isPj) {
          await tx
            .update(user)
            .set({ role: "pj" })
            .where(eq(user.id, userId));

          await tx
            .insert(kelompokPenanggungJawab)
            .values({
              kelompokId: targetUser.idKelompok,
              userId,
            })
            .onConflictDoNothing();
        }
        else {
          await tx
            .update(user)
            .set({ role: "user" })
            .where(eq(user.id, userId));

          await tx
            .delete(kelompokPenanggungJawab)
            .where(
              and(
                eq(kelompokPenanggungJawab.kelompokId, targetUser.idKelompok),
                eq(kelompokPenanggungJawab.userId, userId),
              ),
            );
        }

        return { status: "SUCCESS" } as const;
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    ).andThen((res) => {
      if (res.status === "NOT_FOUND") {
        return errAsync({
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        } as const);
      }
      if (res.status === "ADMIN_USER") {
        return errAsync({
          code: "ADMIN_USER",
          message: "User dengan role Admin tidak dapat diubah menjadi PJ",
        } as const);
      }
      if (res.status === "NOT_VERIFIED") {
        return errAsync({
          code: "NOT_VERIFIED",
          message: "User belum terverifikasi, tidak bisa dijadikan PJ",
        } as const);
      }
      return okAsync({ success: true });
    });
  },

  getPaginatedUsers(query: GetUsersQuerySchema) {
    const offset = (query.page - 1) * query.limit;
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return ResultAsync.fromPromise(
      Promise.all([
        db
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
          .where(whereClause)
          .orderBy(desc(user.createdAt), desc(user.id))
          .limit(query.limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(user)
          .leftJoin(userProfile, eq(userProfile.idUser, user.id))
          .where(whereClause)
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
