import type { CreateUserProfileSchema } from "./model";
import { eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";
import { user } from "~~/server/database/schema/auth";
import { files } from "~~/server/database/schema/files";
import { userProfile } from "~~/server/database/schema/users";

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
};
