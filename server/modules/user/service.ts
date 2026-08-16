import type { UserWithId } from "~~/server/utils/auth";
import type { CreateUserProfileSchema, GetUsersQuerySchema } from "./model";
import { createError } from "h3";
import { db } from "~~/server/database";
import { catchError } from "~~/server/utils/error";
import { deleteFile } from "~~/server/utils/files";
import { generateNoAnggota } from "~~/server/utils/member";
import { UserRepo } from "./repo";

export const UserService = {
  async updateProfile(userObject: UserWithId, data: CreateUserProfileSchema) {
    const oldImage = userObject.image;
    const newImage = data.imageAction === "update" ? data.image : undefined;

    if (data.imageAction === "update" && !newImage) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image baru diperlukan",
      });
    }

    const [txErr] = await catchError(
      db.transaction(async (tx) => {
        await UserRepo.updateUserProfile(userObject.id, oldImage, data, tx);
      }),
    );

    if (txErr) {
      console.error("Gagal memperbarui profil user di DB:", txErr);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal memperbarui profil pengguna",
      });
    }

    const shouldDeleteOldFile
      = (data.imageAction === "remove" && oldImage)
        || (data.imageAction === "update" && oldImage && oldImage !== newImage);

    if (shouldDeleteOldFile && oldImage) {
      const [s3Err] = await catchError(deleteFile(oldImage));
      if (s3Err) {
        console.error(`Gagal menghapus file lama dari S3 (${oldImage}):`, s3Err);
      }
    }

    return { success: true };
  },

  async getProfile(userId: number) {
    const [err, profile] = await catchError(UserRepo.getUserProfile(userId));
    if (err) {
      console.error(`Gagal mengambil profil user ${userId}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data profil",
      });
    }

    if (!profile) {
      throw createError({
        statusCode: 404,
        statusMessage: "User tidak ditemukan",
      });
    }

    return profile;
  },

  async verifyUser(userId: number) {
    const [err, result] = await catchError(
      db.transaction(async (tx) => {
        const targetUser = await UserRepo.getUserById(userId, tx);
        if (!targetUser) {
          throw createError({
            statusCode: 404,
            statusMessage: "User tidak ditemukan",
          });
        }

        if (!targetUser.banned) {
          throw createError({
            statusCode: 400,
            statusMessage: "User sudah terverifikasi",
          });
        }

        const noAnggota = await generateNoAnggota(tx, targetUser.idKelompok);
        await UserRepo.unbanUserAndSetNoAnggota(userId, noAnggota, tx);
        return { noAnggota };
      }),
    );

    if (err) {
      if ("statusCode" in (err as any)) {
        throw err;
      }
      console.error(`Gagal memverifikasi user ${userId}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal memverifikasi akun pengguna",
      });
    }

    return result;
  },

  async setUserPj(userId: number, isPj: boolean) {
    const [err] = await catchError(
      db.transaction(async (tx) => {
        const targetUser = await UserRepo.getUserById(userId, tx);
        if (!targetUser) {
          throw createError({
            statusCode: 404,
            statusMessage: "User tidak ditemukan",
          });
        }

        if (targetUser.role === "admin") {
          throw createError({
            statusCode: 400,
            statusMessage: "User dengan role Admin tidak dapat diubah menjadi PJ",
          });
        }

        if (targetUser.banned) {
          throw createError({
            statusCode: 400,
            statusMessage: "User belum terverifikasi, tidak bisa dijadikan PJ",
          });
        }

        if (isPj) {
          await UserRepo.assignPj(targetUser.idKelompok, userId, tx);
        }
        else {
          await UserRepo.revokePj(targetUser.idKelompok, userId, tx);
        }
      }),
    );

    if (err) {
      if ("statusCode" in (err as any)) {
        throw err;
      }
      console.error(`Gagal mengubah status PJ user ${userId}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengubah penanggung jawab",
      });
    }

    return { success: true };
  },

  async getUsers(query: GetUsersQuerySchema) {
    const [err, result] = await catchError(UserRepo.getPaginatedUsers(query));
    if (err) {
      console.error("Gagal mengambil data paginasi user:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil daftar pengguna",
      });
    }
    return result;
  },
};
