import type { DbClient } from "~~/server/database";
import type { CreateUserProfileSchema, GetUsersQuerySchema } from "./model";
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { files } from "~~/server/database/schema/files";
import { kelompok, kelompokPenanggungJawab } from "~~/server/database/schema/kelompok";
import { userProfile } from "~~/server/database/schema/users";

export const UserRepo = {
  async getUserById(userId: number, client: DbClient = db) {
    const rows = await client
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

  async getUserProfile(userId: number, client: DbClient = db) {
    const rows = await client
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

  async updateUserProfile(
    userId: number,
    oldImage: string | null | undefined,
    data: CreateUserProfileSchema,
    client: DbClient = db,
  ) {
    let finalImage: string | null | undefined = oldImage;

    switch (data.imageAction) {
      case "keep":
        finalImage = oldImage;
        break;
      case "remove":
        finalImage = null;
        if (oldImage) {
          await client.delete(files).where(eq(files.publicId, oldImage));
        }
        break;
      case "update":
        finalImage = data.image ?? null;
        if (data.image) {
          await client
            .update(files)
            .set({ status: "success" })
            .where(eq(files.publicId, data.image));
        }
        if (oldImage && oldImage !== data.image) {
          await client.delete(files).where(eq(files.publicId, oldImage));
        }
        break;
    }

    await client
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

    await client
      .insert(userProfile)
      .values(profileData)
      .onConflictDoUpdate({
        target: userProfile.idUser,
        set: profileData,
      });
  },

  async unbanUserAndSetNoAnggota(userId: number, noAnggota: string, client: DbClient = db) {
    await client
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(eq(user.id, userId));

    await client
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

  async assignPj(kelompokId: number, userId: number, client: DbClient = db) {
    await client
      .update(user)
      .set({ role: "pj" })
      .where(eq(user.id, userId));

    await client
      .insert(kelompokPenanggungJawab)
      .values({
        kelompokId,
        userId,
      })
      .onConflictDoNothing();
  },

  async revokePj(kelompokId: number, userId: number, client: DbClient = db) {
    await client
      .update(user)
      .set({ role: "user" })
      .where(eq(user.id, userId));

    await client
      .delete(kelompokPenanggungJawab)
      .where(
        and(
          eq(kelompokPenanggungJawab.kelompokId, kelompokId),
          eq(kelompokPenanggungJawab.userId, userId),
        ),
      );
  },

  async getPaginatedUsers(query: GetUsersQuerySchema, client: DbClient = db) {
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

    const [items, totalRows] = await Promise.all([
      client
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
      client
        .select({ total: count() })
        .from(user)
        .leftJoin(userProfile, eq(userProfile.idUser, user.id))
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
};
