"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { formatDate } from "@/lib/helpers/date-formaters";
import type { Material } from "@/types/material";
import { Button, SegmentedControl } from "@mantine/core";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import MaterialsListPrintDocument from "@/components/documents/materials-list-print-document";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";

type PrintScope = "all" | "category";

export default function PrintMaterialsModal({
  opened,
  close,
  allMaterials,
  fetchAllMaterials,
}: {
  opened: boolean;
  close: () => void;
  allMaterials: Material[] | undefined;
  fetchAllMaterials: () => Promise<unknown>;
}) {
  const { locale, translate } = useI18n();
  const { data: categoriesData, helpers } = useMaterialCategories();
  const printDate = formatDate(new Date(), locale);

  const [printScope, setPrintScope] = useState<PrintScope>("all");
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(null);

  const isCategoryScope = printScope === "category";
  const canPrint = !isCategoryScope || !!mainCategoryId;

  const selectedMain = mainCategoryId ? helpers.getMaterialCategoryMainById(mainCategoryId) : null;

  const materialsToPrint =
    allMaterials && isCategoryScope && mainCategoryId
      ? allMaterials.filter((m) => helpers.getMaterialCategorySubById(m.subCategoryId)?.mainCategoryId === mainCategoryId)
      : allMaterials;

  const mainCategoriesToPrint =
    categoriesData && isCategoryScope && selectedMain ? [selectedMain] : (categoriesData?.materialCategoryMains ?? []);

  const printHeading = isCategoryScope && selectedMain ? selectedMain.title : translate("All Materials", "جميع المواد");

  function handleClose() {
    close();
    setTimeout(() => {
      setPrintScope("all");
      setMainCategoryId(null);
    }, 250);
  }

  function handleScopeChange(value: string) {
    setPrintScope(value as PrintScope);
    if (value === "all") setMainCategoryId(null);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Materials List", "طباعة قائمة المواد")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Choose whether to print the full materials list or only one main category.",
            "اختر طباعة قائمة المواد كاملة أو فئة رئيسية واحدة فقط.",
          )}
        </p>

        <SegmentedControl
          fullWidth
          radius="md"
          color="teal"
          variant="light"
          value={printScope}
          onChange={handleScopeChange}
          data={[
            { label: translate("All materials", "جميع المواد"), value: "all" },
            { label: translate("One category", "فئة واحدة"), value: "category" },
          ]}
        />

        {isCategoryScope && (
          <SelectMaterialMain
            value={mainCategoryId}
            setValue={setMainCategoryId}
            label={translate("Main Category", "الفئة الرئيسية")}
            placeholder={translate("Select main category", "اختر الفئة الرئيسية")}
            searchable
            required
          />
        )}

        <PrintDocument
          title={translate(`Materials List - ${printDate}`, `قائمة المواد - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            if (!allMaterials) await fetchAllMaterials();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button
              onClick={onClick}
              leftSection={icon}
              color="dark"
              variant="light"
              radius="md"
              fullWidth
              disabled={loading || !canPrint}
            >
              {label}
            </Button>
          )}
        >
          {materialsToPrint && categoriesData && (
            <MaterialsListPrintDocument
              materials={materialsToPrint}
              mainCategories={mainCategoriesToPrint}
              getSubCategory={helpers.getMaterialCategorySubById}
              heading={printHeading}
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
