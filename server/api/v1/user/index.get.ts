import { getUsersQuerySchema } from "~~/server/modules/user/model";
import { UserService } from "~~/server/modules/user/service";
import { adminGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, getUsersQuerySchema);
  return await UserService.getUsers(query);
});
