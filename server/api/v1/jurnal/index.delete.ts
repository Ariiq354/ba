import { createError } from "h3";
import { JurnalRepo } from "~~/server/modules/jurnal/repo";
import { adminGuard } from "~~/server/utils/guard";
import { deleteSchema } from "~~/server/utils/schema";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { ids } = await readValidatedBodySafe(event, deleteSchema);

  for (const id of ids) {
    const res = await JurnalRepo.delete(id);
    if (res.isErr()) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal menghapus transaksi jurnal",
      });
    }
  }

  return { success: true };
});
