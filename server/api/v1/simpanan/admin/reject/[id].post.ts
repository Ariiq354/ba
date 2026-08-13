import { createError } from "h3";
import { rejectMutasiSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

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

  const body = await readValidatedBodySafe(event, rejectMutasiSchema);

  return await SimpananService.rejectMutasi(id, adminUser.id, body).match(
    data => data,
    (err) => {
      if (err.code === "NOT_FOUND") {
        throw createError({
          statusCode: 404,
          statusMessage: err.message,
        });
      }
      if (err.code === "ALREADY_PROCESSED") {
        throw createError({
          statusCode: 400,
          statusMessage: err.message,
        });
      }
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal menolak mutasi",
      });
    },
  );
});
