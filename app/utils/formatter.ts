export function formatRupiah(value: number | bigint | null | undefined): string {
  if (value == null)
    return "Rp 0";
  const num = typeof value === "bigint" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue)
    return "-";
  return new Date(dateValue).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
