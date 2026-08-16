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
      statusMessage: "Validation Error",
      message: "ID transaksi jurnal tidak valid",
    });
  }

  return await JurnalService.deleteJurnal(id);
});
