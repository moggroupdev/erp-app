export type Department = {
  id: string;
  nameEn: string;
  nameAr: string;
  managerId: string | null;
};

export type DepartmentManager = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type DepartmentWithManager = Department & { manager: DepartmentManager | null };

// ==================== DTOs ====================

export type CreateDepartmentDto = {
  nameEn: string;
  nameAr: string;
  managerId: string | null;
};

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
