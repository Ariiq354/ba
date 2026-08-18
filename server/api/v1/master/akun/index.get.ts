import { Effect } from "effect";
import { getAkunQuerySchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { getValidatedQuerySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const query = await getValidatedQuerySafe(event, getAkunQuerySchema);

  return await MasterAkunService.getPaginatedAkun(query).pipe(
    Effect.catchTags({
      DatabaseError: err =>
        Effect.fail(createError({
          statusCode: 500,
          statusMessage: "Database Error",
          message: err.message || "Gagal mengambil data akun",
        })),
    }),
    Effect.runPromise,
  );
});
