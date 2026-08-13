import { createError } from "h3";
import { getMutasiQuerySchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const rawQuery = await getValidatedQuerySafe(event, getMutasiQuerySchema);

  // Force user filter for non-admin requests
  const query = {
    ...rawQuery,
    userId: user.role === "admin" ? (rawQuery.userId ?? user.id) : user.id,
  };

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
