import { UserService } from "~~/server/modules/user/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  return await UserService.getProfile(user.id);
});
