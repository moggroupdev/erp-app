import type { PrivateRequest } from "@/types/api";
import type {
  ProductionDepartmentManagerAssignment,
  AssignProductionDepartmentManagerDto,
} from "@/types/production-department-managers";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

const productionDepartmentManagersApi = {
  async list({ privateRequest, signal }: { privateRequest: PrivateRequest; signal?: AbortSignal }) {
    return await privateRequest<ProductionDepartmentManagerAssignment[]>({
      url: "production-department-managers",
      signal,
    });
  },

  async assign({
    privateRequest,
    department,
    dto,
  }: {
    privateRequest: PrivateRequest;
    department: ProductionSubDepartment;
    dto: AssignProductionDepartmentManagerDto;
  }) {
    return await privateRequest<ProductionDepartmentManagerAssignment>({
      method: "PUT",
      url: `production-department-managers/${department}`,
      data: dto,
    });
  },
};

export default productionDepartmentManagersApi;
