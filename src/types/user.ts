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
  departmentId: string | null;
  productionSubDepartment: ProductionSubDepartment | null;
  isAdmin: boolean;
  roleId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
};

export type UserWithCreator = User & { createdBy: { id: string; name: string } };

// ==================== Authentication Context ====================

export type UserWithExtendedRole = User & { role: RoleWithPermissions };

export type AuthenticationResponse = {
  accessToken: string;
  user: UserWithExtendedRole;
};

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

export type CreateUserDto = {
  name: string;
  phone: string | null;
  email: string | null;
  password: string;
  departmentId: string | null;
  productionSubDepartment: ProductionSubDepartment | null;
  roleId: string;
};

export type UpdateUserDto = Partial<CreateUserDto>;
