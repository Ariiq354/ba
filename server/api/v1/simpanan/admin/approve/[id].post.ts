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
      statusMessage: "Validation Error",
      message: "ID mutasi tidak valid",
    });
  }

  return await SimpananService.approveMutasi(id, adminUser.id);
});
