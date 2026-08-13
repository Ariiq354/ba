import { createError } from "h3";
import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  authGuard(event);

  return await SimpananService.getLatestSahamPrice().match(
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
