import type { UserState, AuthenticationResponse } from "@/types/user";

export default function toUserState(authenticationResponse: AuthenticationResponse): UserState {
  return { ...authenticationResponse.user, accessToken: authenticationResponse.accessToken };
}
