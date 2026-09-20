"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import {
  getProductionSubDepartmentLabel,
  isValidProductionSubDepartment,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MmSourcingType } from "@/lib/constants/enums/mm-sourcing-types";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import { Button } from "@mantine/core";
import BomDraftForm, { mapBomItemToDraftRow } from "../../components/bom-draft-form";

const PAGE_TITLE = { en: "Edit Department BOM", ar: "تعديل قائمة مواد القسم" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const { code, dimensionId, department } = useParams<{
    code: string;
    dimensionId: string;
    department: string;
  }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const departmentParam = decodeURIComponent(department);
  const isValidDepartment = isValidProductionSubDepartment(departmentParam);
  const productionSubDepartment = isValidDepartment ? (departmentParam as ProductionSubDepartment) : null;

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
    enabled: isValidDepartment,
  });

  const bom = bomQuery.data || null;

  const departmentItems = useMemo(() => {
    if (!bom || !productionSubDepartment) return [];
    return bom.standardBoms.filter((item) => item.productionSubDepartment === productionSubDepartment);
  }, [bom, productionSubDepartment]);

  const initialRows = useMemo(() => departmentItems.map(mapBomItemToDraftRow), [departmentItems]);

  const mutation = useMutation({
    mutationFn: async (payload: {
      productionSubDepartment: ProductionSubDepartment;
      items: {
        materialCode: string;
        quantityRequired: number;
        unitOfMeasurementSelected: MaterialUnit;
        mmSourcingType: MmSourcingType | null;
        notes: string | null;
      }[];
    }) => {
      return await bomsApi.replaceDepartment({
        privateRequest,
        dimensionId,
        productionSubDepartment: payload.productionSubDepartment,
        dto: {
          items: payload.items,
        },
      });
    },
  });

  const cancelHref = `/products/${code}/boms/${dimensionId}`;
  const pageTitle = translate(PAGE_TITLE.en, PAGE_TITLE.ar);

  if (!isValidDepartment) {
    return (
      <LayoutBox header={{ title: pageTitle, backLink: true }}>
        <ErrorSection
          errorTitle={translate("Invalid production department", "قسم الانتاج غير صالح")}
          errorMessage={translate(
            "The selected production department is not valid.",
            "قسم الانتاج المحدد غير صالح.",
          )}
          button={{
            text: translate("Back to BOM", "العودة إلى قائمة المواد"),
            onClick: () => router.push(getLocalizedHref(cancelHref)),
          }}
        />
      </LayoutBox>
    );
  }

  if (bomQuery.isFetching) {
    return (
      <LayoutBox header={{ title: pageTitle, backLink: true }}>
        <LoadingSection message={translate("Loading...", "جاري التحميل...")} />
      </LayoutBox>
    );
  }

  if (bomQuery.error) {
    return (
      <LayoutBox header={{ title: pageTitle, backLink: true }}>
        <ErrorSection
          errorTitle={translate("An error occurred while loading dimension data", "حدث خطأ أثناء تحميل بيانات المقاس")}
          errorMessage={getErrorMessage(locale, bomQuery.error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => bomQuery.refetch() }}
        />
      </LayoutBox>
    );
  }

  if (departmentItems.length === 0) {
    return (
      <LayoutBox header={{ title: pageTitle, backLink: true }}>
        <EmptySection
          message={translate(
            "There are no BOM items for this production department.",
            "لا توجد بنود قائمة مواد لقسم الانتاج هذا.",
          )}
        >
          <Button
            variant="light"
            color="teal"
            radius="md"
            onClick={() => router.push(getLocalizedHref(cancelHref))}
          >
            {translate("Back to BOM", "العودة إلى قائمة المواد")}
          </Button>
        </EmptySection>
      </LayoutBox>
    );
  }

  const departmentLabel = getProductionSubDepartmentLabel(productionSubDepartment!, locale);
  const subTitle = bom
    ? `${bom.product.title} · ${formatDimensionLabelText(bom, translation.productDimensionUnit)} · ${departmentLabel}`
    : departmentLabel;

  return (
    <BomDraftForm
      mode="edit"
      title={pageTitle}
      subTitle={subTitle}
      cancelHref={cancelHref}
      initialDepartment={productionSubDepartment}
      initialRows={initialRows}
      lockDepartment
      isSubmitting={mutation.isPending}
      submitError={mutation.error}
      onSubmit={async (payload) => {
        await mutation.mutateAsync(payload);
        await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionId) });
        router.push(getLocalizedHref(cancelHref));
      }}
    />
  );
}
