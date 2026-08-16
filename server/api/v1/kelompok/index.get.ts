import { KelompokService } from "~~/server/modules/kelompok/service";

export default defineEventHandler(async () => {
  return await KelompokService.getOptionsKelompok();
});
