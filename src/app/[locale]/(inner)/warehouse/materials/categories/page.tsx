"use client";

import CategoryTreePage from "@/components/global/category-tree/category-tree-page";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

const PAGE_TITLE = { en: "Material category tree", ar: "شجرة فئات المواد" };

export default function Page() {
  return (
    <CategoryTreePage
      domain="material"
      pageTitle={PAGE_TITLE}
      listPath="/warehouse/materials"
      listPermission={PERMISSIONS.READ_MATERIALS}
      printPermission={PERMISSIONS.PRINT_MATERIALS_LIST}
    />
  );
}
