import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  return await MasterSahamService.getLatestSaham();
});
