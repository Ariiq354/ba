import { createError } from "h3";
import { JurnalService } from "~~/server/modules/jurnal/service";
import { adminGuard } from "~~/server/utils/guard";

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

  return await JurnalService.deleteJurnal(id).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "JURNAL_NOT_FOUND":
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
