import { createError } from "h3";
import { createSahamSchema } from "~~/server/modules/master-saham/model";
import { MasterSahamService } from "~~/server/modules/master-saham/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const body = await readValidatedBodySafe(event, createSahamSchema);

  return await MasterSahamService.createSaham(adminUser.id, body).match(
    data => data,
    (err) => {
      switch (err.code) {
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
