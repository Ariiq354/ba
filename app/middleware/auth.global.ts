// import { useAuthSession } from "~/composables/auth";

export default defineNuxtRouteMiddleware(async () => {
  // const { session } = await useAuthSession();

  // if (to.path === "/") {
  //   if (session.value) {
  //     return navigateTo({ path: "/dashboard" });
  //   }
  // };

  // if (to.path.startsWith("/dashboard")) {
  //   if (!session.value) {
  //     return navigateTo({ path: "/" });
  //   }

  // const isAdminRoute = to.path.startsWith("/dashboard/admin");
  // if (isAdminRoute && session.value.user.role !== "admin") {
  //   return navigateTo({ path: "/dashboard" });
  // }
  // }
});
