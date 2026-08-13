import { createError } from "h3";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const idParam = getRouterParam(event, "id");
  const id = Number.parseInt(idParam || "0", 10);

  if (!id || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID mutasi tidak valid",
    });
  }

  return await SimpananService.deletePendingMutasi(id, user.id).match(
    data => data,
    (err) => {
      switch (err.code) {
        case "NOT_FOUND":
          throw createError({
            statusCode: 404,
            statusMessage: err.message,
          });
        case "CANNOT_DELETE_PROCESSED":
          throw createError({
            statusCode: 400,
            statusMessage: err.message,
          });
        case "DATABASE_ERROR":
        default:
          console.error(err);
          throw createError({
            statusCode: 500,
            statusMessage: "Gagal menghapus mutasi pending",
          });
      }
    },
  );
});
