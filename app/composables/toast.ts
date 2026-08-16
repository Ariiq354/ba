import { FetchError } from "ofetch";
import { useToast } from "#ui/composables/useToast";

export function useToastSuccess(
  title: string,
  description?: string,
) {
  const toast = useToast();
  toast.add({
    title,
    description,
    icon: "i-tabler-circle-check",
    color: "success",
    duration: 3000,
  });
}

export function useToastError(title: string, description?: string) {
  const toast = useToast();
  toast.add({
    title,
    description,
    icon: "i-tabler-circle-x",
    color: "error",
    duration: 3000,
  });
}

export function extractErrorMessage(error: unknown, fallback = "Terjadi kesalahan."): string {
  if (error instanceof FetchError && error.data && typeof error.data === "object" && "message" in error.data && error.data.message) {
    return String(error.data.message);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
