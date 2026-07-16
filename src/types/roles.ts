import { Permission } from "@/lib/constants/enums/permissions";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  maxDiscountPct: number | null;
  departmentId: string | null;
  homeUrl: string | null;
  createdAt: Date;
  createdBy: { id: string; name: string };
};

export type RoleWithPermissions = Role & { permissions: Permission[] };

// ==================== DTOs ====================

export type CreateRoleDto = {
  name: string;
  description: string | null;
  maxDiscountPct: number | null;
  departmentId: string | null;
  homeUrl: string;
  permissions: Permission[];
};

export type UpdateRoleDto = Partial<CreateRoleDto>;
