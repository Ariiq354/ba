import { createError } from "h3";
import { updateAkunSchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);
  const body = await readValidatedBodySafe(event, updateAkunSchema);

  return await MasterAkunService.updateAkun(id, body).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "AKUN_NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });

        case "KODE_AKUN_EXISTS":
          throw createError({
            statusCode: 400,
            statusMessage: err.message,
          });

        case "DATABASE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "Database Error",
          });

        default: {
          err satisfies never;
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
