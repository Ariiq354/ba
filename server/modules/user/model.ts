import { z } from "zod";
import { paginationSearchSchema } from "~~/server/utils/schema";

export const createUserProfileSchema = z.object({
  image: z.string().optional(),
  imageAction: z.enum(["keep", "remove", "update"]),
  name: z.string().min(1),
  noHp: z.string().optional(),
  nik: z.string().optional(),
  namaBank: z.string().optional(),
  noRekening: z.string().optional(),
  pemilikRekening: z.string().optional(),
  jalan: z.string().optional(),
  idProvinsi: z.string().optional(),
  idKota: z.string().optional(),
  idKecamatan: z.string().optional(),
  idKelurahan: z.string().optional(),
});

export type CreateUserProfileSchema = z.infer<typeof createUserProfileSchema>;

export const verifyUserSchema = z.object({
  userId: z.number().int().positive(),
});

export type VerifyUserSchema = z.infer<typeof verifyUserSchema>;

export const setGroupPjSchema = z.object({
  userId: z.number().int().positive(),
  isPj: z.boolean(),
});

export type SetGroupPjSchema = z.infer<typeof setGroupPjSchema>;

export const getUsersQuerySchema = z.object({
  ...paginationSearchSchema.shape,
  status: z.enum(["all", "pending", "verified"]).default("all"),
});

export type GetUsersQuerySchema = z.infer<typeof getUsersQuerySchema>;
