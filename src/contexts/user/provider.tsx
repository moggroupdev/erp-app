"use client";

import { useState, useEffect } from "react";
import { type UserState } from "@/types/user";
import UserContext from "./context";
import useRefresh from "@/hooks/use-refresh";
import useLogout from "@/hooks/use-logout";
import toUserState from "@/lib/helpers/to-user-state";
import { LOGGED_IN_FLAG } from "@/lib/constants/global";

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(null);

  const [loading, setLoading] = useState(true);
  const [isOnClient, setIsOnClient] = useState(false);

  const refreshAccessToken = useRefresh();
  const logout = useLogout();

  // First useEffect: Mark that we're on the client
  useEffect(() => {
    setIsOnClient(true);
  }, []);

  useEffect(() => {
    if (!isOnClient) return;

    async function getUser() {
      try {
        const response = await refreshAccessToken();
        setUser(toUserState(response));
      } catch {
        logout({ redirectToLogin: false });
      } finally {
        setLoading(false);
      }
    }

    if (!user && localStorage.getItem(LOGGED_IN_FLAG) === "true") getUser();
    else setLoading(false);
  }, [isOnClient, user, refreshAccessToken, logout]);


  return (
    <UserContext.Provider value={{ isInitializing: loading, user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
