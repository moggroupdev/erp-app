"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import CategoryTree from "@/components/global/category-tree";

const PAGE_TITLE = { en: "Material category tree", ar: "شجرة فئات المواد" };

export default function Page() {
  const { translate } = useI18n();
  const { data, loading, error, reload } = useMaterialCategories();

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
        mains={data?.materialCategoryMains ?? []}
        subs={data?.materialCategorySubs ?? []}
        loading={loading}
        error={error}
        reload={reload}
        listPath="/warehouse/materials"
        listPermission={PERMISSIONS.READ_MATERIALS}
      />
    </LayoutBox>
  );
}
