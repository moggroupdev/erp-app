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
  managerId: string | null;
};

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
