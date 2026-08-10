import { createError } from "h3";
import { marginParamsSchema, updateMarginSchema } from "~~/server/modules/master-margin/model";
import { MasterMarginService } from "~~/server/modules/master-margin/service";
import { adminGuard } from "~~/server/utils/guard";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, marginParamsSchema);
  const body = await readValidatedBodySafe(event, updateMarginSchema);

  return await MasterMarginService.updateMargin(id, body).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "MARGIN_NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });

        case "DATABASE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "Database Error",
          });

        default: {
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
