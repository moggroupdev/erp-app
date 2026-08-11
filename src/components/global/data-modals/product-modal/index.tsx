import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import type { Product, ProductWithCreator } from "@/types/product";
import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { TextInput, Button, Textarea, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectProductMain from "@/components/global/selections/reference-based/select-product-main";
import SelectProductSub from "@/components/global/selections/reference-based/select-product-sub";
import SelectProductSourceType from "@/components/global/selections/enum-based/select-product-source-type";

type ProductFormEntity = Product | ProductWithCreator;

export default function ProductModal({
  opened,
  close,
  productToUpdate,
  setProductToUpdate,
  isForList = false,
  onSuccess,
}: {
  opened: boolean;
  close: () => void;
  productToUpdate: ProductFormEntity | null;
  setProductToUpdate: React.Dispatch<React.SetStateAction<Product | null>>;
  isForList?: boolean;
  onSuccess?: () => void;
}) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useProductCategories();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [estimatedProductionTime, setEstimatedProductionTime] = useState<number | string>("");
  const [pricingFactor, setPricingFactor] = useState<number | string>("");

  function reset() {
    setTitle("");
    setDescription("");
    setMainCategoryId(null);
    setSubCategoryId(null);
    setSourceType(null);
    setEstimatedProductionTime("");
    setPricingFactor("");
  }

  useEffect(() => {
    if (productToUpdate) {
      setTitle(productToUpdate.title);
      setDescription(productToUpdate.description || "");
      setSubCategoryId(productToUpdate.subCategoryId);
      const sub = helpers.getProductCategorySubById(productToUpdate.subCategoryId);
      setMainCategoryId(sub?.mainCategoryId ?? null);
      setSourceType(productToUpdate.sourceType);
      setEstimatedProductionTime(productToUpdate.estimatedProductionTime ?? "");
      setPricingFactor(productToUpdate.pricingFactor);
    } else reset();
  }, [productToUpdate, helpers]);

  useEffect(() => {
    if (!subCategoryId || !mainCategoryId) return;
    const sub = helpers.getProductCategorySubById(subCategoryId);
    if (sub && sub.mainCategoryId !== mainCategoryId) setSubCategoryId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainCategoryId, subCategoryId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedEstimatedProductionTime =
        estimatedProductionTime === "" || estimatedProductionTime === null || estimatedProductionTime === undefined
          ? null
          : Number(estimatedProductionTime);

      const normalizedPricingFactor = Number(pricingFactor);

      const dto = {
        title: title.trim(),
        description: description.trim() || null,
        subCategoryId: subCategoryId!,
        sourceType: sourceType as ProductSourceType,
        estimatedProductionTime: normalizedEstimatedProductionTime,
        pricingFactor: normalizedPricingFactor,
      };

      return productToUpdate
        ? await productsApi.update({ privateRequest, code: productToUpdate.code, dto })
        : await productsApi.create({ privateRequest, dto });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      onSuccess?.();
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) return setValidationError(translate("Please enter the product title.", "يرجى إدخال عنوان المنتج."));
    if (!mainCategoryId)
      return setValidationError(translate("Please select a main category.", "يرجى اختيار الفئة الرئيسية."));
    if (!subCategoryId) return setValidationError(translate("Please select a subcategory.", "يرجى اختيار الفئة الفرعية."));
    if (!sourceType) return setValidationError(translate("Please select a source type.", "يرجى اختيار نوع المصدر."));

    const normalizedEstimatedProductionTime =
      estimatedProductionTime === "" || estimatedProductionTime === null || estimatedProductionTime === undefined
        ? null
        : Number(estimatedProductionTime);
    if (
      normalizedEstimatedProductionTime !== null &&
      (Number.isNaN(normalizedEstimatedProductionTime) || normalizedEstimatedProductionTime < 1)
    ) {
      return setValidationError(
        translate(
          "Estimated production time must be at least 1 day.",
          "يجب أن يكون وقت الإنتاج المقدر يوماً واحداً على الأقل.",
        ),
      );
    }

    const normalizedPricingFactor = Number(pricingFactor);
    if (Number.isNaN(normalizedPricingFactor) || normalizedPricingFactor < 0) {
      return setValidationError(
        translate("Pricing factor must be a non-negative number.", "يجب أن يكون معامل التسعير رقماً غير سالب."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      if (isForList) {
        if (productToUpdate) setProductToUpdate(null);
        else reset();
      }
    }, 250);
  }

  const titleLabel = translate(
    `${productToUpdate ? "Edit" : "Add"} Product`,
    `${productToUpdate ? "تعديل المنتج" : "إضافة منتج"}`,
  );

  const normalizedEstimatedProductionTime =
    estimatedProductionTime === "" || estimatedProductionTime === null || estimatedProductionTime === undefined
      ? null
      : Number(estimatedProductionTime);

  const normalizedPricingFactor =
    pricingFactor === "" || pricingFactor === null || pricingFactor === undefined ? null : Number(pricingFactor);

  const isRequiredInputFilled = !!(title.trim() && mainCategoryId && subCategoryId && sourceType && pricingFactor !== "");

  const isDataChanged = productToUpdate
    ? title.trim() !== productToUpdate.title ||
      (description.trim() || null) !== productToUpdate.description ||
      subCategoryId !== productToUpdate.subCategoryId ||
      sourceType !== productToUpdate.sourceType ||
      normalizedEstimatedProductionTime !== productToUpdate.estimatedProductionTime ||
      normalizedPricingFactor !== productToUpdate.pricingFactor
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (productToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={titleLabel}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          label={translate("Title", "العنوان")}
          placeholder={translate("Enter product title", "أدخل عنوان المنتج")}
          required
          autoFocus
          radius="md"
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label={translate("Description (Optional)", "الوصف (اختياري)")}
          placeholder={translate("Enter description", "أدخل الوصف")}
          radius="md"
          autosize
        />

        <SelectProductMain
          value={mainCategoryId}
          setValue={setMainCategoryId}
          label={translate("Main Category", "الفئة الرئيسية")}
          placeholder={translate("Select main category", "اختر الفئة الرئيسية")}
          searchable
          required
        />

        <SelectProductSub
          value={subCategoryId}
          setValue={setSubCategoryId}
          mainCategoryScope={mainCategoryId}
          label={translate("Subcategory", "الفئة الفرعية")}
          placeholder={translate("Select subcategory", "اختر الفئة الفرعية")}
          searchable
          required
        />

        <SelectProductSourceType
          value={sourceType}
          setValue={setSourceType}
          label={translate("Source Type", "نوع المصدر")}
          placeholder={translate("Select source type", "اختر نوع المصدر")}
          required
        />

        <NumberInput
          value={pricingFactor}
          onChange={setPricingFactor}
          label={translate("Pricing Factor", "معامل التسعير")}
          placeholder={translate("Enter pricing factor", "أدخل معامل التسعير")}
          min={0}
          allowNegative={false}
          decimalScale={5}
          required
          radius="md"
        />

        <NumberInput
          value={estimatedProductionTime}
          onChange={setEstimatedProductionTime}
          label={translate("Estimated Production Time", "وقت الإنتاج المقدر")}
          placeholder={translate("Days", "أيام")}
          min={1}
          allowNegative={false}
          decimalScale={0}
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {titleLabel}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
