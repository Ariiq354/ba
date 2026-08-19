import { Effect } from "effect";
import { updateAkunSchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { idParamsSchema } from "~~/server/utils/schema";
import { getValidatedRouterParamsSafe, readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, idParamsSchema);
  const body = await readValidatedBodySafe(event, updateAkunSchema);

  return await MasterAkunService.updateAkun(id, body).pipe(
    Effect.catchTags({
      ItemNotFoundError: () =>
        Effect.fail(createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: `Akun dengan id ${id} tidak ditemukan`,
        })),
      DuplicateKodeAkunError: err =>
        Effect.fail(createError({
          statusCode: 400,
          statusMessage: "Conflict",
          message: `Kode akun '${err.kodeAkun}' sudah digunakan oleh akun lain`,
        })),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);

        return Effect.fail(createError({
          statusCode: 500,
          statusMessage: "Database Error",
          message: "Gagal memperbarui data akun",
        }));
      },
    }),
    Effect.runPromise,
  );
});
