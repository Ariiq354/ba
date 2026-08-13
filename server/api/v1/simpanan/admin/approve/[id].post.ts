import { createError } from "h3";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { adminGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const adminUser = adminGuard(event);
  const idParam = getRouterParam(event, "id");
  const id = Number.parseInt(idParam || "0", 10);

  if (!id || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID mutasi tidak valid",
    });
  }

  return await SimpananService.approveMutasi(id, adminUser.id).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });
        case "ALREADY_PROCESSED":
        case "INSUFFICIENT_BALANCE":
          throw createError({
            statusCode: 400,
            statusMessage: err.message,
          });
        case "DATABASE_ERROR":
        default:
          console.error(err);
          throw createError({
            statusCode: 500,
            statusMessage: "Gagal menyetujui mutasi",
          });
      }
    },
  );
});
