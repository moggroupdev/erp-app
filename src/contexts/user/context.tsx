import { createContext } from "react";
import { type UserContextProps } from "@/types/user";

const UserContext = createContext<UserContextProps>({
  isInitializing: false,
  user: null,
  setUser: () => {},
});

export default UserContext;
