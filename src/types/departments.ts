import { ContextProps } from "./global";

export type Department = {
  id: string;
  nameEn: string;
  nameAr: string;
  manager: { id: string; name: string } | null;
};

// ==================== Context ====================

export type DepartmentsContextProps = ContextProps<Department[]>;

// ==================== DTOs ====================

export type CreateDepartmentDto = {
  nameEn: string;
  nameAr: string;
};

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;

export type UpdateDepartmentManagerDto = { managerId: string };
