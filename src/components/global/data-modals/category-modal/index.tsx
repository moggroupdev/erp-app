import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, TextInput } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import categoriesApi from "@/lib/api/categories";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import type { CategoryDomain, MaterialCategoryMain, MaterialCategorySub } from "@/types/categories";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";
import SelectProductMain from "@/components/global/selections/reference-based/select-product-main";

export type CategoryModalTarget =
  | { level: "main"; item: MaterialCategoryMain | null }
  | { level: "sub"; item: MaterialCategorySub | null; defaultMainCategoryId?: string; mainCategoryTitle?: string };

export default function CategoryModal({
  opened,
  close,
  domain,
  target,
  setTarget,
}: {
  opened: boolean;
  close: () => void;
  domain: CategoryDomain;
  target: CategoryModalTarget | null;
  setTarget: React.Dispatch<React.SetStateAction<CategoryModalTarget | null>>;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");
  const [legacyCode, setLegacyCode] = useState("");
  const [title, setTitle] = useState("");
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(null);

  const level = target?.level ?? "main";
  const item = target?.item ?? null;
  const isSub = level === "sub";
  const isAddingSub = isSub && !item;
  const lockedMainTitle = target?.level === "sub" ? (target.mainCategoryTitle ?? "") : "";

  function reset() {
    setLegacyCode("");
    setTitle("");
    setMainCategoryId(null);
  }

  useEffect(() => {
    if (!target) {
      reset();
      return;
    }

    if (target.item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLegacyCode(target.item.legacyCode);
      setTitle(target.item.title);
      setMainCategoryId(target.level === "sub" ? target.item.mainCategoryId : null);
      return;
    }

    reset();
    if (target.level === "sub") setMainCategoryId(target.defaultMainCategoryId ?? null);
  }, [target]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSub) {
        const dto = { legacyCode, title, mainCategoryId: mainCategoryId! };
        return item
          ? await categoriesApi.updateSub({ privateRequest, domain, id: item.id, dto })
          : await categoriesApi.createSub({ privateRequest, domain, dto });
      }

      const dto = { legacyCode, title };
      return item
        ? await categoriesApi.updateMain({ privateRequest, domain, id: item.id, dto })
        : await categoriesApi.createMain({ privateRequest, domain, dto });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!legacyCode.trim())
      return setValidationError(translate("Please enter a category code", "يرجى إدخال كود الفئة"));
    if (!title.trim()) return setValidationError(translate("Please enter a category title", "يرجى إدخال اسم الفئة"));
    if (isSub && !mainCategoryId)
      return setValidationError(translate("Please select a main category", "يرجى اختيار فئة رئيسية"));

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setTarget(null);
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const entityLabel = isSub
    ? translate("subcategory", "الفئة الفرعية")
    : translate("main category", "الفئة الرئيسية");
  const titleText = item
    ? translate(`Edit ${isSub ? "subcategory" : "main category"}`, `تعديل ${entityLabel}`)
    : translate(`Add ${isSub ? "subcategory" : "main category"}`, `إضافة ${entityLabel}`);

  const isRequiredInputFilled = !!(legacyCode && title && (!isSub || mainCategoryId));
  const isDataChanged = item
    ? legacyCode !== item.legacyCode ||
      title !== item.title ||
      (isSub && "mainCategoryId" in item && mainCategoryId !== item.mainCategoryId)
    : false;
  const isReadyToSubmit = isRequiredInputFilled && (item ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={titleText}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isAddingSub ? (
          <div>
            <p className="mb-1 text-sm font-medium">{translate("Main category", "الفئة الرئيسية")}</p>
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">{lockedMainTitle}</p>
          </div>
        ) : isSub ? (
          domain === "material" ? (
            <SelectMaterialMain
              value={mainCategoryId}
              setValue={setMainCategoryId}
              label={translate("Main category", "الفئة الرئيسية")}
              placeholder={translate("Select a main category", "اختر فئة رئيسية")}
              required
            />
          ) : (
            <SelectProductMain
              value={mainCategoryId}
              setValue={setMainCategoryId}
              label={translate("Main category", "الفئة الرئيسية")}
              placeholder={translate("Select a main category", "اختر فئة رئيسية")}
              required
            />
          )
        ) : null}

        <TextInput
          label={translate("Code", "الكود")}
          placeholder={translate("Enter the category code", "أدخل كود الفئة")}
          value={legacyCode}
          onChange={(e) => setLegacyCode(e.target.value)}
          radius="md"
          required
        />

        <TextInput
          label={translate("Title", "الاسم")}
          placeholder={translate("Enter the category title", "أدخل اسم الفئة")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          radius="md"
          required
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {titleText}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
