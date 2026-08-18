import { Effect } from "effect";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { deleteSchema } from "~~/server/utils/schema";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { ids } = await readValidatedBodySafe(event, deleteSchema);

  return await MasterAkunService.deleteAkun(ids).pipe(
    Effect.catchTags({
      DeleteAkunError: err =>
        Effect.fail(createError({
          statusCode: 500,
          statusMessage: "Database Error",
          message: err.message || "Gagal menghapus data akun (kemungkinan sedang digunakan dalam transaksi)",
        })),
    }),
    Effect.runPromise,
  );
});
