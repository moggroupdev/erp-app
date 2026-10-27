"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Menu } from "@mantine/core";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { formatDate } from "@/lib/helpers/date-formaters";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import type { CategoryDomain } from "@/types/categories";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import PrintDocument from "@/components/ui/print-document";
import CategoryTreePrintDocument from "@/components/documents/category-tree-print-document";
import CategoryModal, { type CategoryModalTarget } from "@/components/global/data-modals/category-modal";
import CategoryTree, { type CategoryTreeMain, type CategoryTreeSub } from "@/components/global/category-tree";

const MATERIAL_PERMISSIONS = {
  add: PERMISSIONS.ADD_MATERIAL_CATEGORY,
  update: PERMISSIONS.UPDATE_MATERIAL_CATEGORY,
};

const PRODUCT_PERMISSIONS = {
  add: PERMISSIONS.ADD_PRODUCT_CATEGORY,
  update: PERMISSIONS.UPDATE_PRODUCT_CATEGORY,
};

export default function CategoryTreePage({
  domain,
  pageTitle,
  listPath,
  listPermission,
  printPermission,
}: {
  domain: CategoryDomain;
  pageTitle: { en: string; ar: string };
  listPath: string;
  listPermission: Permission;
  printPermission: Permission;
}) {
  const { locale, translate } = useI18n();
  const materialCategories = useMaterialCategories();
  const productCategories = useProductCategories();
  const source = domain === "material" ? materialCategories : productCategories;
  const crudPermissions = domain === "material" ? MATERIAL_PERMISSIONS : PRODUCT_PERMISSIONS;

  const canPrint = useHasPermission(printPermission);
  const canAdd = useHasPermission(crudPermissions.add);
  const printDate = formatDate(new Date(), locale);

  useDocumentTitle(translate(pageTitle.en, pageTitle.ar), "dashboard");

  const mains =
    domain === "material"
      ? (materialCategories.data?.materialCategoryMains ?? [])
      : (productCategories.data?.productCategoryMains ?? []);
  const subs =
    domain === "material"
      ? (materialCategories.data?.materialCategorySubs ?? [])
      : (productCategories.data?.productCategorySubs ?? []);

  const title = translate(pageTitle.en, pageTitle.ar);
  const showPrint = canPrint && !source.loading && !source.error && mains.length > 0;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [target, setTarget] = useState<CategoryModalTarget | null>(null);

  function openCreateMain() {
    setTarget({ level: "main", item: null });
    openModal();
  }

  function openCreateSub(mainId: string) {
    const main =
      domain === "material"
        ? materialCategories.helpers.getMaterialCategoryMainById(mainId)
        : productCategories.helpers.getProductCategoryMainById(mainId);
    setTarget({
      level: "sub",
      item: null,
      defaultMainCategoryId: mainId,
      mainCategoryTitle: main?.title ?? "",
    });
    openModal();
  }

  function openEditMain(main: CategoryTreeMain) {
    setTarget({ level: "main", item: main });
    openModal();
  }

  function openEditSub(sub: CategoryTreeSub) {
    setTarget({ level: "sub", item: sub });
    openModal();
  }

  return (
    <LayoutBox
      header={{
        title,
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={source.loading} onRefetch={source.reload} />
            <ActionsMenu>
              {showPrint && (
                <PrintDocument
                  title={`${title} - ${printDate}`}
                  buttonLabel={translate("Print category tree", "طباعة شجرة الفئات")}
                  buttonType="menu"
                >
                  <CategoryTreePrintDocument documentLabel={title} mains={mains} subs={subs} />
                </PrintDocument>
              )}
              {showPrint && canAdd && <Menu.Divider />}
              {canAdd && (
                <Menu.Item leftSection={<Plus size={14} />} onClick={openCreateMain}>
                  {translate("Add main category", "إضافة فئة رئيسية")}
                </Menu.Item>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      <CategoryTree
        mains={mains}
        subs={subs}
        loading={source.loading}
        error={source.error}
        reload={source.reload}
        listPath={listPath}
        listPermission={listPermission}
        crud={{
          addPermission: crudPermissions.add,
          updatePermission: crudPermissions.update,
          onAddMain: openCreateMain,
          onAddSub: openCreateSub,
          onEditMain: openEditMain,
          onEditSub: openEditSub,
        }}
      />

      <CategoryModal opened={modalOpened} close={closeModal} domain={domain} target={target} setTarget={setTarget} />
    </LayoutBox>
  );
}
