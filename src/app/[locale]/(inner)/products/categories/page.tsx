"use client";

import CategoryTreePage from "@/components/global/category-tree/category-tree-page";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

const PAGE_TITLE = { en: "Product category tree", ar: "شجرة فئات المنتجات" };

export default function Page() {
  return (
    <CategoryTreePage
      domain="product"
      pageTitle={PAGE_TITLE}
      listPath="/products"
      listPermission={PERMISSIONS.READ_PRODUCTS}
      printPermission={PERMISSIONS.PRINT_PRODUCTS_LIST}
    />
  );
}
