import type { TableColumn } from "@nuxt/ui";
import { UBadge, UButton, UIcon } from "#components";
import { formatDate } from "~/utils/formatter";

export interface UserItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  idKelompok: number | null;
  namaKelompok: string | null;
  kodeKelompok: string | null;
  noAnggota: string | null;
  createdAt: string;
}

export const statusOptions = [
  { label: "Semua Status", value: "all" },
  { label: "Pending Verifikasi", value: "pending" },
  { label: "Terverifikasi", value: "verified" },
];

export function getUserColumns(onVerify: (user: UserItem) => void): TableColumn<UserItem>[] {
  return [
    {
      header: "Nama",
      accessorKey: "name",
      cell: ({ row }) =>
        h("div", { class: "flex flex-col" }, [
          h("span", { class: "font-medium text-gray-900 dark:text-white" }, row.original.name),
          h("span", { class: "text-xs text-gray-500" }, `@${row.original.username}`),
        ]),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Kelompok",
      accessorKey: "namaKelompok",
      cell: ({ row }) =>
        row.original.namaKelompok
          ? `${row.original.namaKelompok} (${row.original.kodeKelompok})`
          : "-",
    },
    {
      header: "No. Anggota",
      accessorKey: "noAnggota",
      cell: ({ row }) => row.original.noAnggota || "-",
    },
    {
      header: "Tanggal Daftar",
      accessorKey: "createdAt",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      header: "Status",
      accessorKey: "banned",
      cell: ({ row }) => {
        const isPending = Boolean(row.original.banned);
        return h(
          UBadge,
          {
            color: isPending ? "warning" : "success",
            variant: "subtle",
            size: "sm",
          },
          () => (isPending ? "Pending" : "Terverifikasi"),
        );
      },
    },
    {
      header: "Aksi",
      id: "actions",
      cell: ({ row }) => {
        if (row.original.banned) {
          return h(
            UButton,
            {
              size: "xs",
              color: "primary",
              icon: "i-tabler-user-check",
              onClick: () => onVerify(row.original),
            },
            () => "Verifikasi",
          );
        }
        return h("span", { class: "text-xs text-gray-400 font-medium flex items-center gap-1" }, [
          h(UIcon, { name: "i-tabler-check", class: "text-green-500 shrink-0" }),
          "Tervalidasi",
        ]);
      },
    },
  ];
}
