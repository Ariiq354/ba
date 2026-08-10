import type { UserWithId } from "~~/server/utils/auth";
import type { CreateUserProfileSchema } from "./model";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { deleteFile } from "~~/server/utils/files";
import { UserRepo } from "./repo";

export const UserService = {
  updateProfile(userObject: UserWithId, data: CreateUserProfileSchema) {
    const oldImage = userObject.image;
    const newImage = data.imageAction === "update" ? data.image : undefined;

    if (data.imageAction === "update" && !newImage) {
      return errAsync({
        code: "IMAGE_REQUIRED",
        message: "Image baru diperlukan",
      } as const);
    }

    return UserRepo.updateUserProfile(userObject.id, oldImage, data).andThen(() => {
      const shouldDeleteOldFile
        = (data.imageAction === "remove" && oldImage)
          || (data.imageAction === "update" && oldImage && oldImage !== newImage);

      if (shouldDeleteOldFile && oldImage) {
        return ResultAsync.fromPromise(
          deleteFile(oldImage),
          cause => ({ code: "S3_DELETE_ERROR", cause } as const),
        ).map(() => void 0);
      }

      return okAsync(void 0);
    });
  },

  getProfile(userId: number) {
    return UserRepo.getUserProfile(userId).andThen((profile) => {
      if (!profile) {
        return errAsync({
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        } as const);
      }
      return okAsync(profile);
    });
  },
};
