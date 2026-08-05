import { ResultAsync } from "neverthrow";
import { db } from "~~/server/database";

export const KelompokRepo = {
  getOptionsKelompok() {
    return ResultAsync.fromPromise(
      db.query.kelompok.findMany(),
      cause => ({ code: "DATABASE_ERROR", cause } as const),
    );
  },
};
