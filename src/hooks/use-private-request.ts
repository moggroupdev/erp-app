import type { ApiRequestOptions, PrivateRequest } from "@/types/api";
import useUser from "@/contexts/user/hook";
import useLogout from "@/hooks/use-logout";
import useRefresh from "@/hooks/use-refresh";
import apiRequest from "@/lib/helpers/api-request";
import toUserState from "@/lib/helpers/to-user-state";

// These error messages should match those returned by the API
const accessTokenErrors = ["Access denied: No access token provided.", "Access denied: Invalid access token."];
const refreshTokenErrors = ["Access denied: No refresh token provided.", "Access denied: Invalid refresh token."];

export default function usePrivateRequest(): PrivateRequest {
  const { user, setUser } = useUser();
  const logout = useLogout();
  const refreshAccessToken = useRefresh();

  async function privateRequest<T>({
    url,
    method = "GET",
    headers = {},
    params = {},
    data = null,
    credentials = "same-origin",
    signal,
    download,
    filename,
  }: ApiRequestOptions): Promise<T> {
    try {
      if (!user) throw new Error("No authenticated user.");
      // Add the access token to the request headers if it doesn't exist
      let newHeaders = headers;
      if (!headers.authorization) newHeaders = { authorization: `Bearer ${user.accessToken}`, ...headers };
      // Send the request with the access token
      return await apiRequest<T>({
        url,
        method,
        headers: newHeaders,
        params,
        data,
        credentials,
        signal,
        download,
        filename,
      });
    } catch (error) {
      if (accessTokenErrors.includes((error as Error).message)) {
        try {
          // Refresh the access token
          const newAuthenticationResponse = await refreshAccessToken();
          const newHeaders = { authorization: `Bearer ${newAuthenticationResponse.accessToken}`, ...headers };
          // Update the user context with the new access token
          setUser(toUserState(newAuthenticationResponse));
          // Send a new request with the new access token
          return await privateRequest({
            url,
            method,
            headers: newHeaders,
            params,
            data,
            credentials,
            signal,
            download,
            filename,
          });
        } catch (error) {
          if (refreshTokenErrors.includes((error as Error).message))
            await logout({ redirectToLogin: true, preserveRedirect: true });
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  return privateRequest;
}
