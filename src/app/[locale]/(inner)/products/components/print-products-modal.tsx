"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import ProductsListPrintDocument from "@/components/documents/products/products-list-print-document";

export default function PrintProductsModal({ opened, close }: { opened: boolean; close: () => void }) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { data: categoriesData, helpers } = useProductCategories();
  const printDate = formatDate(new Date(), locale);

  const [includeSubcategory, setIncludeSubcategory] = useState(false);

  const { data: productsToPrint, refetch: fetchProductsToPrint } = useQuery({
    queryKey: queryKeys.products.list({ limit: "list-all-to-print" }),
    queryFn: ({ signal }) => productsApi.listAllToPrint({ privateRequest, signal }),
    staleTime: staleTimes.products,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => setIncludeSubcategory(false), 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Products List", "طباعة قائمة المنتجات")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Choose whether to show the subcategory. Products are then sorted by subcategory, then by name, inside each main category.",
            "اختر عرض الفئة الفرعية. تُرتب المنتجات بعدها حسب الفئة الفرعية ثم الاسم داخل كل فئة رئيسية.",
          )}
        </p>

        <Checkbox
          checked={includeSubcategory}
          onChange={(e) => setIncludeSubcategory(e.currentTarget.checked)}
          label={translate("Display subcategory", "عرض الفئة الفرعية")}
          radius="md"
        />

        <PrintDocument
          title={translate(`Products List - ${printDate}`, `قائمة المنتجات - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            if (!productsToPrint) await fetchProductsToPrint();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button onClick={onClick} leftSection={icon} color="dark" variant="light" radius="md" fullWidth disabled={loading}>
              {label}
            </Button>
          )}
        >
          {productsToPrint && categoriesData && (
            <ProductsListPrintDocument
              products={productsToPrint}
              mainCategories={categoriesData.productCategoryMains}
              getSubCategory={helpers.getProductCategorySubById}
              includeSubcategory={includeSubcategory}
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
