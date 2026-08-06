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
