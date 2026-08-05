import { z } from "zod";

export const loginSchema = z.object({
  username: z.string("Usernam wajib diisi"),
  password: z.string("Password wajib diisi").min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean(),
});

export type LoginSchema = z.output<typeof loginSchema>;

export const initLoginFormdata: Partial<LoginSchema> = {
  username: undefined,
  password: undefined,
  rememberMe: false,
};

export const registerSchema = z.object({
  name: z.string("Nama wajib diisi"),
  username: z.string("Username wajib diisi"),
  password: z.string("Password wajib diisi").min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string("Konfirmasi password wajib diisi").min(8, "Konfirmasi password minimal 8 karakter"),
  idKelompok: z.number("Silahkan pilih kelompok"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

export const initRegisterFormdata: Partial<RegisterSchema> = {
  username: undefined,
  password: undefined,
  confirmPassword: undefined,
  idKelompok: undefined,
};

export type RegisterSchema = z.infer<typeof registerSchema>;
