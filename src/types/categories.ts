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

export type Categories = {
  materialCategoryMains: MaterialCategoryMain[];
  materialCategorySubs: MaterialCategorySub[];
  productCategoryMains: ProductCategoryMain[];
  productCategorySubs: ProductCategorySub[];
};
