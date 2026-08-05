import type { UseFetchOptions } from "#app";
import { authClient } from "~/utils/auth";

type Session = (typeof authClient)["$Infer"]["Session"];

export async function useAuthSession() {
  const relativeFetch = (path: string, opts?: UseFetchOptions<Session>) => {
    const url = path.startsWith("http") ? new URL(path).pathname : path;
    return useFetch<Session>(url, opts);
  };

  const { data, isPending, error } = await authClient.useSession(relativeFetch);

  return { session: data, isPending, error };
}
