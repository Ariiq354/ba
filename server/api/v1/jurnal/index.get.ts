import { getJurnalQuerySchema } from "~~/server/modules/jurnal/model";
import { JurnalService } from "~~/server/modules/jurnal/service";
import { adminGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, getJurnalQuerySchema);
  return await JurnalService.getPaginatedJurnal(query);
});
