"use client";

import { redirect, RedirectType } from "next/navigation";
import { useUser } from "@/contexts/user/hook";
import { FROM_QUERY_PARAM } from "@/lib/constants/global";

const HOME_PATH = "/dashboard";

export default function AuthenticationGuard({
  access,
  children,
}: {
  access: "guest" | "authenticated";
  children: React.ReactNode;
}) {
  const { isInitializing, user } = useUser();

  if (isInitializing) return null;

  // For inner pages that require authentication
  if (access === "authenticated" && !user) {
    const currentPath = typeof window !== "undefined" ? window.location.pathname + (window.location.search || "") : "/";
    redirect(`/login?${FROM_QUERY_PARAM}=${encodeURIComponent(currentPath)}`, RedirectType.replace);
  }

  // For outer pages that require unauthenticated users
  if (access === "guest" && user) {
    const redirectTo =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get(FROM_QUERY_PARAM) || HOME_PATH
        : HOME_PATH;
    redirect(redirectTo, RedirectType.replace);
  }

  return children;
}
