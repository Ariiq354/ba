import { updateMarginSchema } from "~~/server/modules/master-margin/model";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);
  const body = await readValidatedBodySafe(event, updateMarginSchema);
  return await MasterMarginService.updateMargin(id, body);
});
