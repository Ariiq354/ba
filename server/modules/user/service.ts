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

    yield* Effect.tryPromise({
      try: async () => {
        await db.transaction(async (tx) => {
          await Effect.runPromise(UserRepo.updateUserProfile(userObject.id, oldImage, data, tx));
        });
      },
      catch: error => new DatabaseError({ error }),
    });

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
    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          const targetUser = await Effect.runPromise(UserRepo.findById(userId, tx));
          if (!targetUser) {
            throw new ItemNotFoundError({ id: userId });
          }

          if (!targetUser.banned) {
            throw new UserAlreadyVerifiedError({ userId });
          }

          const noAnggota = await generateNoAnggota(tx, targetUser.idKelompok);
          await Effect.runPromise(UserRepo.unbanUserAndSetNoAnggota(userId, noAnggota, tx));
          return { noAnggota };
        });
      },
      catch: (error) => {
        if (
          error instanceof ItemNotFoundError
          || error instanceof UserAlreadyVerifiedError
        ) {
          return error;
        }
        return new DatabaseError({ error });
      },
    });
  }),

  setUserPj: Effect.fn("UserService.setUserPj")(function* (userId: number, isPj: boolean) {
    yield* Effect.tryPromise({
      try: async () => {
        await db.transaction(async (tx) => {
          const targetUser = await Effect.runPromise(UserRepo.findById(userId, tx));
          if (!targetUser) {
            throw new ItemNotFoundError({ id: userId });
          }

          if (targetUser.role === "admin") {
            throw new AdminCannotBePjError({ userId });
          }

          if (targetUser.banned) {
            throw new UserUnverifiedError({ userId });
          }

          if (isPj) {
            await Effect.runPromise(UserRepo.assignPj(targetUser.idKelompok, userId, tx));
          }
          else {
            await Effect.runPromise(UserRepo.revokePj(targetUser.idKelompok, userId, tx));
          }
        });
      },
      catch: (error) => {
        if (
          error instanceof ItemNotFoundError
          || error instanceof AdminCannotBePjError
          || error instanceof UserUnverifiedError
        ) {
          return error;
        }
        return new DatabaseError({ error });
      },
    });

    return { success: true };
  }),

  getUsers: Effect.fn("UserService.getUsers")(function* (query: GetUsersQuerySchema) {
    return yield* UserRepo.findAll(query);
  }),
};
