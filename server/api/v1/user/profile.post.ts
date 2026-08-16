import { createUserProfileSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createUserProfileSchema);
  return await UserService.updateProfile(user, body);
});
