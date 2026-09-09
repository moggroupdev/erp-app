import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

export type ProductionDepartmentManagerAssignment = {
  department: ProductionSubDepartment;
  managerId: string | null;
  deputyManagerId: string | null;
  manager: { id: string; name: string } | null;
  deputyManager: { id: string; name: string } | null;
};

// ==================== DTOs ====================

export type AssignProductionDepartmentManagerDto = {
  managerId: string | null;
  deputyManagerId: string | null;
};
