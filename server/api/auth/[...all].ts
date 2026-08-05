import { auth } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  return await auth.handler(toWebRequest(event));
});
