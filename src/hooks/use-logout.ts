import { useRouter } from "next/navigation";
import useUser from "@/contexts/user/hook";
import authApi from "@/lib/api/auth";
import { LOGGED_IN_FLAG, FROM_QUERY_PARAM } from "@/lib/constants/global";

export default function useLogout() {
  const { setUser } = useUser();
  const router = useRouter();

  return async ({ redirectToLogin, preserveRedirect }: { redirectToLogin: boolean; preserveRedirect?: boolean }) => {
    try {
      setUser(null);
      localStorage.removeItem(LOGGED_IN_FLAG);
      await authApi.logout();
      if (!redirectToLogin) return;
      else {
        if (preserveRedirect) {
          // Read the current location at call-time (client only) instead of using Next's search/path hooks, which would require additional suspense boundaries during pre-render.
          const currentPath =
            typeof window !== "undefined" ? window.location.pathname + (window.location.search || "") : "/";
          router.replace(`/login?${FROM_QUERY_PARAM}=${encodeURIComponent(currentPath)}`);
        } else router.replace("/login");
      }
    } catch (error) {
      throw error;
    }
  };
}
