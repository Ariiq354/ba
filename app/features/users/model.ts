import type { TableColumn } from "@nuxt/ui";
import { UBadge, UButton } from "#components";
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

export function getUserColumns(
  onVerify: (user: UserItem) => void,
  onSetPj: (user: UserItem, isPj: boolean) => void,
): TableColumn<UserItem>[] {
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
      header: "Role",
      accessorKey: "role",
      cell: ({ row }) => {
        const role = row.original.role;
        if (role === "admin") {
          return h(
            UBadge,
            {
              color: "primary",
              variant: "subtle",
              size: "sm",
            },
            () => "Admin",
          );
        }
        if (role === "pj") {
          return h(
            UBadge,
            {
              color: "warning",
              variant: "subtle",
              size: "sm",
            },
            () => "PJ",
          );
        }
        return h(
          UBadge,
          {
            color: "neutral",
            variant: "subtle",
            size: "sm",
          },
          () => "User",
        );
      },
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

        if (row.original.role === "admin") {
          return h("span", { class: "text-xs text-gray-400 font-medium" }, "-");
        }

        const isPj = row.original.role === "pj";
        if (isPj) {
          return h(
            UButton,
            {
              size: "xs",
              color: "warning",
              variant: "soft",
              icon: "i-tabler-user-x",
              onClick: () => onSetPj(row.original, false),
            },
            () => "Cabut PJ",
          );
        }

        return h(
          UButton,
          {
            size: "xs",
            color: "info",
            variant: "soft",
            icon: "i-tabler-user-star",
            onClick: () => onSetPj(row.original, true),
          },
          () => "Jadikan PJ",
        );
      },
    },
  ];
}
