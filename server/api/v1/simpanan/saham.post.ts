import { createError } from "h3";
import { createSetorSahamSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createSetorSahamSchema);

  return await SimpananService.createSetorSaham(user.id, body).match(
    data => data,
    (err) => {
      if (err.code === "SAHAM_MASTER_NOT_FOUND") {
        throw createError({
          statusCode: 400,
          statusMessage: err.message,
        });
      }
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal membuat pengajuan setor saham",
      });
    },
  );
});
