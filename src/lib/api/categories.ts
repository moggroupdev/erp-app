import apiRequest from "@/lib/helpers/api-request";
import type { MaterialCategoryMain, MaterialCategorySub, ProductCategoryMain, ProductCategorySub } from "@/types/categories";

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
};

export default categoriesApi;
