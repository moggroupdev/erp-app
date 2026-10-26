import apiRequest from "@/lib/helpers/api-request";
import type { PrivateRequest } from "@/types/api";
import type {
  CategoryDomain,
  CreateCategoryMainDto,
  CreateCategorySubDto,
  MaterialCategoryMain,
  MaterialCategorySub,
  ProductCategoryMain,
  ProductCategorySub,
  UpdateCategoryMainDto,
  UpdateCategorySubDto,
} from "@/types/categories";

function mainsPath(domain: CategoryDomain) {
  return `categories/${domain}-category-mains`;
}

function subsPath(domain: CategoryDomain) {
  return `categories/${domain}-category-subs`;
}

const categoriesApi = {
  async getMaterialCategories() {
    return await apiRequest<{
      materialCategoryMains: MaterialCategoryMain[];
      materialCategorySubs: MaterialCategorySub[];
    }>({ url: "categories/material-categories" });
  },

  async getProductCategories() {
    return await apiRequest<{
      productCategoryMains: ProductCategoryMain[];
      productCategorySubs: ProductCategorySub[];
    }>({ url: "categories/product-categories" });
  },

  async createMain({
    privateRequest,
    domain,
    dto,
  }: {
    privateRequest: PrivateRequest;
    domain: CategoryDomain;
    dto: CreateCategoryMainDto;
  }) {
    return await privateRequest<MaterialCategoryMain | ProductCategoryMain>({
      method: "POST",
      url: mainsPath(domain),
      data: dto,
    });
  },

  async updateMain({
    privateRequest,
    domain,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    domain: CategoryDomain;
    id: string;
    dto: UpdateCategoryMainDto;
  }) {
    return await privateRequest<MaterialCategoryMain | ProductCategoryMain>({
      method: "PUT",
      url: `${mainsPath(domain)}/${id}`,
      data: dto,
    });
  },

  async createSub({
    privateRequest,
    domain,
    dto,
  }: {
    privateRequest: PrivateRequest;
    domain: CategoryDomain;
    dto: CreateCategorySubDto;
  }) {
    return await privateRequest<MaterialCategorySub | ProductCategorySub>({
      method: "POST",
      url: subsPath(domain),
      data: dto,
    });
  },

  async updateSub({
    privateRequest,
    domain,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    domain: CategoryDomain;
    id: string;
    dto: UpdateCategorySubDto;
  }) {
    return await privateRequest<MaterialCategorySub | ProductCategorySub>({
      method: "PUT",
      url: `${subsPath(domain)}/${id}`,
      data: dto,
    });
  },
};

export default categoriesApi;
