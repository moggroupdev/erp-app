import { ContextProps } from "./global";

export type Department = {
  id: string;
  nameEn: string;
  nameAr: string;
  managerId: string | null;
};

export type DepartmentWithManager = Department & { manager: { id: string; name: string } | null };

// ==================== DTOs ====================

export type CreateDepartmentDto = {
  nameEn: string;
  nameAr: string;
};

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
