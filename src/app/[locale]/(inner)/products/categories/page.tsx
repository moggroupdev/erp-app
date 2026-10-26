"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { formatDate } from "@/lib/helpers/date-formaters";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import PrintDocument from "@/components/ui/print-document";
import CategoryTreePrintDocument from "@/components/documents/category-tree-print-document";
import CategoryTree from "@/components/global/category-tree";

const PAGE_TITLE = { en: "Product category tree", ar: "شجرة فئات المنتجات" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { data, loading, error, reload } = useProductCategories();
  const canPrint = useHasPermission(PERMISSIONS.PRINT_PRODUCTS_LIST);
  const printDate = formatDate(new Date(), locale);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const mains = data?.productCategoryMains ?? [];
  const subs = data?.productCategorySubs ?? [];
  const pageTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);
  const showPrint = canPrint && !loading && !error && mains.length > 0;

  return (
    <LayoutBox
      header={{
        title: pageTitle,
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={loading} onRefetch={reload} />
            <ActionsMenu>
              {showPrint && (
                <PrintDocument
                  title={`${pageTitle} - ${printDate}`}
                  buttonLabel={translate("Print category tree", "طباعة شجرة الفئات")}
                  buttonType="menu"
                >
                  <CategoryTreePrintDocument documentLabel={pageTitle} mains={mains} subs={subs} />
                </PrintDocument>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      <CategoryTree
        mains={mains}
        subs={subs}
        loading={loading}
        error={error}
        reload={reload}
        listPath="/products"
        listPermission={PERMISSIONS.READ_PRODUCTS}
      />
    </LayoutBox>
  );
}
