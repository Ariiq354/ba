import { createError } from "h3";
import { updateJurnalSchema } from "~~/server/modules/jurnal/model";
import { JurnalService } from "~~/server/modules/jurnal/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const idStr = getRouterParam(event, "id");
  const id = Number(idStr);

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID tidak valid",
    });
  }

  const body = await readValidatedBodySafe(event, updateJurnalSchema);

  return await JurnalService.updateJurnal(id, body).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "JURNAL_NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });

        case "KODE_TRANSAKSI_EXISTS":
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
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
