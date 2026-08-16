import { createMarginSchema } from "~~/server/modules/master-margin/model";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, createMarginSchema);
  return await MasterMarginService.createMargin(body);
});
