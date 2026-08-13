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
      const code = typeof err === "object" && err && "code" in err ? String(err.code) : "DATABASE_ERROR";
      const message = typeof err === "object" && err && "message" in err ? String(err.message) : "Gagal menyetujui mutasi";
      if (code === "NOT_FOUND") {
        throw createError({
          statusCode: 404,
          statusMessage: message,
        });
      }
      if (code === "ALREADY_PROCESSED" || code === "INSUFFICIENT_BALANCE") {
        throw createError({
          statusCode: 400,
          statusMessage: message,
        });
      }
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: message,
      });
    },
  );
});
