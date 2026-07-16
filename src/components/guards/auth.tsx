"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user/hook";
import { DEFAULT_HOME_HREF, FROM_QUERY_PARAM } from "@/lib/constants/global";

export default function AuthenticationGuard({
  access,
  children,
}: {
  access: "guest" | "authenticated";
  children: React.ReactNode;
}) {
  const { isInitializing, user } = useUser();
  const router = useRouter();

  // For inner pages that require authentication
  const shouldRedirectToLogin = !isInitializing && access === "authenticated" && !user;
  // For outer pages that require unauthenticated users
  const shouldRedirectToHome = !isInitializing && access === "guest" && !!user;

  // Navigation must happen in an effect, not during render - calling router
  // methods (or `redirect()`) synchronously in the render body can desync
  // React's hook bookkeeping and throw "Rendered more hooks than during the
  // previous render" from the internal Next.js Router component.
  useEffect(() => {
    if (shouldRedirectToLogin) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname + (window.location.search || "") : "/";
      router.replace(`/login?${FROM_QUERY_PARAM}=${encodeURIComponent(currentPath)}`);
    } else if (shouldRedirectToHome) {
      const fromParam =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get(FROM_QUERY_PARAM) : null;
      const redirectTo = fromParam || user?.role?.homeUrl || DEFAULT_HOME_HREF;
      router.replace(redirectTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRedirectToLogin, shouldRedirectToHome]);

  if (isInitializing || shouldRedirectToLogin || shouldRedirectToHome) return null;

  return children;
}
