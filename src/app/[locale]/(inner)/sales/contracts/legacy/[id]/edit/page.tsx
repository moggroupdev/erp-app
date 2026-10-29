"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import contractsApi from "@/lib/api/contracts";
import productsApi from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { ProductDimension } from "@/types/product";
import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";
import { isOpenLegacyContract } from "../../../helpers";
import { toLegacyFormInitial } from "../../create/form-state";
import LegacyContractForm from "../../legacy-contract-form";

const PAGE_TITLE = { en: "Edit Legacy Contract Review", ar: "تعديل مراجعة عقد مرحلية" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const {
    data: contract,
    isFetching: contractFetching,
    error: contractError,
    refetch: refetchContract,
  } = useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: ({ signal }) => contractsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.contracts,
  });

  const productCodes = useMemo(() => {
    if (!contract) return [];
    return [...new Set(contract.items.filter((item) => !item.cancelledAt).map((item) => item.productCode))];
  }, [contract]);

  const productQueries = useQueries({
    queries: productCodes.map((code) => ({
      queryKey: queryKeys.products.detail(code),
      queryFn: ({ signal }: { signal: AbortSignal }) => productsApi.get({ privateRequest, code, signal }),
      staleTime: staleTimes.products,
      enabled: !!contract && isOpenLegacyContract(contract),
    })),
  });

  const dimensionQueries = useQueries({
    queries: productCodes.map((code) => ({
      queryKey: queryKeys.products.dimensions(code),
      queryFn: ({ signal }: { signal: AbortSignal }) => productsApi.listDimensions({ privateRequest, code, signal }),
      staleTime: staleTimes.products,
      enabled: !!contract && isOpenLegacyContract(contract),
    })),
  });

  const catalogFetching = productQueries.some((query) => query.isFetching) || dimensionQueries.some((query) => query.isFetching);
  const catalogError = productQueries.find((query) => query.error)?.error ?? dimensionQueries.find((query) => query.error)?.error;
  const isFetching = contractFetching || catalogFetching;
  const error = contractError ?? catalogError;

  function retry() {
    void refetchContract();
    productQueries.forEach((query) => {
      void query.refetch();
    });
    dimensionQueries.forEach((query) => {
      void query.refetch();
    });
  }

  const initial = useMemo(() => {
    if (!contract || !isOpenLegacyContract(contract)) return null;
    if (productCodes.length > 0 && (productQueries.some((query) => !query.data) || dimensionQueries.some((query) => !query.data))) {
      return null;
    }

    const productsByCode = new Map<
      string,
      { title: string; sourceType: ProductSourceType; dimensions: ProductDimension[] }
    >();
    productCodes.forEach((code, index) => {
      const product = productQueries[index]?.data;
      const dimensions = dimensionQueries[index]?.data ?? [];
      if (!product) return;
      productsByCode.set(code, { title: product.title, sourceType: product.sourceType, dimensions });
    });
    return toLegacyFormInitial(contract, productsByCode);
  }, [contract, productCodes, productQueries, dimensionQueries]);

  if (isFetching && !initial) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <LoadingSection message={translate("Loading contract review...", "جاري تحميل مراجعة العقد...")} />
      </LayoutBox>
    );
  }

  if (error) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <ErrorSection
          errorTitle={translate("Error loading contract review", "خطأ في تحميل مراجعة العقد")}
          errorMessage={getErrorMessage(locale, error)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: retry }}
        />
      </LayoutBox>
    );
  }

  if (!contract || !isOpenLegacyContract(contract) || !initial) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <ErrorSection
          errorTitle={translate("Cannot edit this contract review", "لا يمكن تعديل مراجعة العقد هذه")}
          errorMessage={translate(
            "Only open legacy contract reviews can be updated this way.",
            "يمكن تعديل مراجعات العقود المرحلية المفتوحة فقط بهذه الطريقة.",
          )}
        />
      </LayoutBox>
    );
  }

  return <LegacyContractForm key={contract.id} mode="edit" contractId={contract.id} initial={initial} />;
}
