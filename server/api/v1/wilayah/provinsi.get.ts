import { WilayahService } from "~~/server/modules/wilayah/service";

export default defineEventHandler(async () => {
  return await WilayahService.getProvinsi();
});
