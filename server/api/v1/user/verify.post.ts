import { verifyUserSchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, verifyUserSchema);
  return await UserService.verifyUser(body.userId);
});
