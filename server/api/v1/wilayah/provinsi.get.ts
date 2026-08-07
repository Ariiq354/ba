import { createError } from "h3";
import { WilayahService } from "~~/server/modules/wilayah/service";

export default defineEventHandler(async () => {
  return await WilayahService.getProvinsi().match(
    data => data,
    (err) => {
      switch (err.code) {
        case "DATABASE_ERROR":
          console.error(err.cause);

          throw createError({
            statusCode: 500,
            statusMessage: "Database Error",
          });

        default: {
          throw createError({
            statusCode: 500,
            statusMessage: "Unhandled error",
          });
        }
      }
    },
  );
});
