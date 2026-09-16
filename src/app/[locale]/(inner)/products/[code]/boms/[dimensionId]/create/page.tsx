"use client";

import { useMemo, useState } from "react";
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
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import BomDraftForm, { createEmptyRow, type BomDraftRow } from "../components/bom-draft-form";

const PAGE_TITLE = { en: "Create BOM", ar: "إنشاء قائمة مواد" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const { code, dimensionId } = useParams<{ code: string; dimensionId: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const [initialRows] = useState<BomDraftRow[]>(() => [createEmptyRow()]);

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
  });

  const bom = bomQuery.data || null;
  const departmentsWithBom = useMemo(
    () =>
      (bom?.standardBoms.map((item) => item.productionSubDepartment).filter(Boolean) as ProductionSubDepartment[]) ??
      [],
    [bom?.standardBoms],
  );

  const mutation = useMutation({
    mutationFn: async (payload: {
      productionSubDepartment: ProductionSubDepartment;
      items: {
        materialCode: string;
        quantityRequired: number;
        unitOfMeasurementSelected: MaterialUnit;
        notes: string | null;
      }[];
    }) => {
      return await bomsApi.create({
        privateRequest,
        dimensionId,
        dto: {
          items: payload.items.map((item) => ({
            ...item,
            productionSubDepartment: payload.productionSubDepartment,
          })),
        },
      });
    },
  });

  if (bomQuery.isFetching) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <LoadingSection message={translate("Loading...", "جاري التحميل...")} />
      </LayoutBox>
    );
  }

  if (bomQuery.error) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <ErrorSection
          errorTitle={translate("An error occurred while loading dimension data", "حدث خطأ أثناء تحميل بيانات المقاس")}
          errorMessage={getErrorMessage(locale, bomQuery.error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => bomQuery.refetch() }}
        />
      </LayoutBox>
    );
  }

  const cancelHref = `/products/${code}/boms/${dimensionId}`;

  return (
    <BomDraftForm
      mode="create"
      title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
      subTitle={
        bom ? `${bom.product.title} · ${formatDimensionLabelText(bom, translation.productDimensionUnit)}` : undefined
      }
      cancelHref={cancelHref}
      initialDepartment={null}
      initialRows={initialRows}
      excludeDepartments={departmentsWithBom}
      departmentsWithBom={departmentsWithBom}
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
