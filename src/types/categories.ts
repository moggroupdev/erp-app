export type MaterialCategoryMain = {
  id: string;
  legacyCode: string;
  title: string;
};

export type MaterialCategorySub = {
  id: string;
  legacyCode: string;
  title: string;
  mainCategoryId: string;
};

export type ProductCategoryMain = {
  id: string;
  legacyCode: string;
  title: string;
};

export type ProductCategorySub = {
  id: string;
  legacyCode: string;
  title: string;
  mainCategoryId: string;
};

export type MaterialCategories = {
  materialCategoryMains: MaterialCategoryMain[];
  materialCategorySubs: MaterialCategorySub[];
};

export type ProductCategories = {
  productCategoryMains: ProductCategoryMain[];
  productCategorySubs: ProductCategorySub[];
};

export type CategoryDomain = "material" | "product";

export type CreateCategoryMainDto = {
  legacyCode: string;
  title: string;
};

export type UpdateCategoryMainDto = Partial<CreateCategoryMainDto>;

export type CreateCategorySubDto = CreateCategoryMainDto & {
  mainCategoryId: string;
};

export type UpdateCategorySubDto = Partial<CreateCategorySubDto>;
