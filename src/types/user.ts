import { Permission } from "@/lib/constants/enums/permissions";
import { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import { RoleWithPermissions } from "./roles";

export type User = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  isPhoneVerified: boolean;
  email: string | null;
  isEmailVerified: boolean;
  isAdmin: boolean;
  departmentId: string | null;
  productionSubDepartment: ProductionSubDepartment | null;
  createdAt: Date;
  deletedAt: Date | null;
  createdBy: { id: string; name: string } | null;
};

export type UserWithExtendedRole = User & { role: RoleWithPermissions };

export type AuthenticationResponse = {
  accessToken: string;
  user: UserWithExtendedRole;
};

// ==================== Context ====================

// This is the type of the user object that is stored in the context
export type UserState = UserWithExtendedRole & { accessToken: string };

export type UserContextProps = {
  isInitializing: boolean;
  user: UserState | null;
  setUser: React.Dispatch<React.SetStateAction<UserState | null>>;
};

// ==================== DTOs ====================

export type LoginDto = {
  email: string | null;
  phone: string | null;
  password: string;
};
