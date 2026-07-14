import authApi from "@/lib/api/auth";
import type { AuthenticationResponse } from "@/types/user";

let refreshPromise: Promise<AuthenticationResponse> | null = null;

/** Deduplicates concurrent refresh calls so only one network request runs at a time. */
export function refreshAccessToken(): Promise<AuthenticationResponse> {
  if (!refreshPromise) {
    refreshPromise = authApi.refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export default function useRefresh() {
  return refreshAccessToken;
}
