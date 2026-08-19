import type { UserWithId } from "~~/server/utils/auth";
import type { CreateUserProfileSchema, GetUsersQuerySchema } from "./model";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { DatabaseError, ItemNotFoundError } from "~~/server/utils/error";
import { deleteFile } from "~~/server/utils/files";
import { generateNoAnggota } from "~~/server/utils/member";
import {
  AdminCannotBePjError,
  ProfileImageRequiredError,
  UserAlreadyVerifiedError,
  UserUnverifiedError,
} from "./errors";
import { UserRepo } from "./repo";

export const UserService = {
  updateProfile: Effect.fn("UserService.updateProfile")(function* (
    userObject: UserWithId,
    data: CreateUserProfileSchema,
  ) {
    const oldImage = userObject.image;
    const newImage = data.imageAction === "update" ? data.image : undefined;

    if (data.imageAction === "update" && !newImage) {
      return yield* new ProfileImageRequiredError();
    }

    yield* UserRepo.updateUserProfile(userObject.id, oldImage, data);

    const shouldDeleteOldFile
      = (data.imageAction === "remove" && oldImage)
        || (data.imageAction === "update" && oldImage && oldImage !== newImage);

    if (shouldDeleteOldFile && oldImage) {
      yield* Effect.tryPromise({
        try: async () => {
          try {
            await deleteFile(oldImage);
          }
          catch (s3Err) {
            console.error(`Gagal menghapus file lama dari S3 (${oldImage}):`, s3Err);
          }
        },
        catch: () => undefined,
      });
    }

    return { success: true };
  }),

  getProfile: Effect.fn("UserService.getProfile")(function* (userId: number) {
    const profile = yield* UserRepo.getProfile(userId);
    if (!profile) {
      return yield* new ItemNotFoundError({ id: userId });
    }
    return profile;
  }),

  verifyUser: Effect.fn("UserService.verifyUser")(function* (userId: number) {
    const targetUser = yield* UserRepo.findById(userId);
    if (!targetUser) {
      return yield* new ItemNotFoundError({ id: userId });
    }

    if (!targetUser.banned) {
      return yield* new UserAlreadyVerifiedError({ userId });
    }

    const noAnggota = yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          const generatedNo = await generateNoAnggota(tx, targetUser.idKelompok);
          await Effect.runPromise(UserRepo.unbanUserAndSetNoAnggota(userId, generatedNo, tx));
          return generatedNo;
        });
      },
      catch: error => new DatabaseError({ error }),
    });

    return { noAnggota };
  }),

  setUserPj: Effect.fn("UserService.setUserPj")(function* (userId: number, isPj: boolean) {
    const targetUser = yield* UserRepo.findById(userId);
    if (!targetUser) {
      return yield* new ItemNotFoundError({ id: userId });
    }

    if (targetUser.role === "admin") {
      return yield* new AdminCannotBePjError({ userId });
    }

    if (targetUser.banned) {
      return yield* new UserUnverifiedError({ userId });
    }

    if (isPj) {
      yield* UserRepo.assignPj(targetUser.idKelompok, userId);
    }
    else {
      yield* UserRepo.revokePj(targetUser.idKelompok, userId);
    }

    return { success: true };
  }),

  getUsers: Effect.fn("UserService.getUsers")(function* (query: GetUsersQuerySchema) {
    return yield* UserRepo.findAll(query);
  }),
};
