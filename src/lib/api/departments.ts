import type { PrivateRequest } from "@/types/api";
import type { Department, CreateDepartmentDto, UpdateDepartmentDto } from "@/types/departments";

const departmentsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateDepartmentDto }) {
    return await privateRequest<Department>({ method: "POST", url: "departments", data: dto });
  },

  async list({ privateRequest, signal }: { privateRequest: PrivateRequest; signal?: AbortSignal }) {
    return await privateRequest<Department[]>({ url: "departments", signal });
  },

  async get({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<Department>({ url: `departments/${id}` });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateDepartmentDto }) {
    return await privateRequest<Department>({ method: "PUT", url: `departments/${id}`, data: dto });
  },
};

export default departmentsApi;
