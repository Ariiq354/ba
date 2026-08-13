import { createError } from "h3";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  const user = authGuard(event);

  return await SimpananService.getSaldo(user.id).match(
    data => data,
    (err) => {
      console.error(err);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Error",
      });
    },
  );
});
