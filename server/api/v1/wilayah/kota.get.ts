import { kotaQuerySchema } from "~~/server/modules/wilayah/model";
import { WilayahService } from "~~/server/modules/wilayah/service";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuerySafe(event, kotaQuerySchema);
  return await WilayahService.getKotaByProvinsiId(query.idProvinsi);
});
