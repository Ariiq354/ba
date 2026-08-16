import { SimpananService } from "~~/server/modules/simpanan/service";
import { authGuard } from "~~/server/utils/guard";

export default defineEventHandler(async (event) => {
  authGuard(event);
  return await SimpananService.getLatestSahamPrice();
});
