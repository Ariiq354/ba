import type { DbClient } from "~~/server/database";
import { db } from "~~/server/database";

export const KelompokRepo = {
  async getOptionsKelompok(client: DbClient = db) {
    return await client.query.kelompok.findMany();
  },
};
