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

        await tx
          .update(userProfile)
          .set({
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
          })
          .where(eq(userProfile.idUser, userId));
      }),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
