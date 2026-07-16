import { Permission } from "@/lib/constants/enums/permissions";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  maxDiscountPct: number | null;
  departmentId: string | null;
  homeUrl: string | null;
  createdAt: Date;
  createdBy: string;
};

export type RoleWithCreator = Role & { createdBy: { id: string; name: string } };

export type RoleWithPermissions = Role & { permissions: Permission[] };

export type RoleWithCreatorWithPermissions = RoleWithCreator & { permissions: Permission[] };

// ==================== DTOs ====================

export type CreateRoleDto = {
  name: string;
  description: string | null;
  maxDiscountPct: number | null;
  departmentId: string | null;
  homeUrl: string; // Required here
  permissions: Permission[];
};

export type UpdateRoleDto = Partial<CreateRoleDto>;
