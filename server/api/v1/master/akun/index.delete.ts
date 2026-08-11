import { createError } from "h3";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { deleteSchema } from "~~/server/utils/schema";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { ids } = await readValidatedBodySafe(event, deleteSchema);

  return await MasterAkunService.deleteAkun(ids).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "DATABASE_ERROR":
          console.error(err.cause);
          throw createError({
            statusCode: 500,
            statusMessage: "Database Error / Akun sedang digunakan dalam transaksi",
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
