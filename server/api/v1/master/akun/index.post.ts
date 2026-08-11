import { createError } from "h3";
import { createAkunSchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, createAkunSchema);

  return await MasterAkunService.createAkun(body).match(
    data => data,
    (err) => {
      switch (err.code) {
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
