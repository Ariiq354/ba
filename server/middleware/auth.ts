import type { UserWithId } from "../utils/auth";
import { auth } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });
  event.context.user = session?.user as unknown as UserWithId;
});

declare module "h3" {
  interface H3EventContext {
    user: UserWithId | undefined;
  }
}
