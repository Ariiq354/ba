import { createError } from "h3";
import { createSetoranSchema } from "~~/server/modules/simpanan/model";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);
  const body = await readValidatedBodySafe(event, createSetoranSchema);

  return await SimpananService.createSetoran(user.id, body).match(
    data => data,
    (err) => {
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal membuat pengajuan setoran",
      });
    },
  );
});
