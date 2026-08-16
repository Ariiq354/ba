import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { deleteSchema } from "~~/server/utils/schema";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { ids } = await readValidatedBodySafe(event, deleteSchema);
  return await MasterMarginService.deleteMargin(ids);
});
