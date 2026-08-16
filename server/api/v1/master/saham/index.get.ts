import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";
import { paginationSchema } from "~~/server/utils/schema";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, paginationSchema);
  return await MasterSahamService.getPaginatedSaham(query);
});
