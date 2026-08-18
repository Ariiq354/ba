import { Effect } from "effect";
import { createAkunSchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, createAkunSchema);

  return await MasterAkunService.createAkun(body).pipe(
    Effect.catchTags({
      DuplicateKodeAkunError: err =>
        Effect.fail(createError({
          statusCode: 400,
          statusMessage: "Conflict",
          message: `Kode akun '${err.kodeAkun}' sudah digunakan`,
        })),
      DatabaseError: err =>
        Effect.fail(createError({
          statusCode: 500,
          statusMessage: "Database Error",
          message: err.message || "Gagal membuat data akun",
        })),
    }),
    Effect.runPromise,
  );
});
