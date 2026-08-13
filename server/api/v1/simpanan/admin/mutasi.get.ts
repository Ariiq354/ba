import { createError } from "h3";
import { getMutasiQuerySchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { adminGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, getMutasiQuerySchema);

  return await SimpananService.getPaginatedMutasi(query).match(
    data => data,
    (err) => {
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
      });
    },
  );
});
