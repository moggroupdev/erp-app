"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import CategoryTree from "@/components/global/category-tree";

const PAGE_TITLE = { en: "Product category tree", ar: "شجرة فئات المنتجات" };

export default function Page() {
  const { translate } = useI18n();
  const { data, loading, error, reload } = useProductCategories();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: <RefetchButton isFetching={loading} onRefetch={reload} />,
      }}
    >
      <CategoryTree
        mains={data?.productCategoryMains ?? []}
        subs={data?.productCategorySubs ?? []}
        loading={loading}
        error={error}
        reload={reload}
        listPath="/products"
        listPermission={PERMISSIONS.READ_PRODUCTS}
      />
    </LayoutBox>
  );
}
