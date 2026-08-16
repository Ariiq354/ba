import { kecamatanQuerySchema } from "~~/server/modules/wilayah/model";
import { WilayahService } from "~~/server/modules/wilayah/service";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuerySafe(event, kecamatanQuerySchema);
  return await WilayahService.getKecamatanByKotaId(query.idKota);
});
