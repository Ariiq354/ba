import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { admin as adminPlugins, username } from "better-auth/plugins";
import { db } from "../database";
import { relations } from "../database/relations";
import * as schema from "../database/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      relations,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async user => ({
          data: {
            ...user,
            banned: true,
            banReason: "Akun belum terverifikasi",
            banExpires: null,
          },
        }),
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 7,
  },
  advanced: {
    database: {
      generateId: false,
      joins: true,
    },
  },
  user: {
    additionalFields: {
      idKelompok: {
        type: "number",
        input: true,
        required: true,
      },
    },
  },
  plugins: [
    username(),
    adminPlugins(),
  ],
});

export type UserWithId = Omit<typeof auth.$Infer.Session.user, "id"> & {
  id: number;
};
