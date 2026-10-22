"use client";

import { useEffect, useRef, useState } from "react";
import { NumberInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import { roundSensitivity, SENSITIVITY_DECIMALS, toCommittedSensitivity } from "./sensitivity";

const SENSITIVITY_DEBOUNCE_MS = 400;

export default function SensitivityFilter({
  value,
  onChange,
  description,
}: {
  value: number;
  onChange: (value: number) => void;
  description: string;
}) {
  const { locale, translate } = useI18n();
  const [draft, setDraft] = useState<number | string>(value);
  const [debouncedDraft] = useDebouncedValue(draft, SENSITIVITY_DEBOUNCE_MS);
  const focusedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const next = toCommittedSensitivity(debouncedDraft);
    if (next == null || next === value) return;
    onChangeRef.current(next);
  }, [debouncedDraft, value]);

  function commitDraft() {
    const next = toCommittedSensitivity(draft);
    if (next == null) {
      setDraft(value);
      return;
    }
    const committed = roundSensitivity(next);
    setDraft(committed);
    if (committed !== value) onChange(committed);
  }

  return (
    <NumberInput
      value={draft}
      onChange={setDraft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        commitDraft();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      label={translate("Sensitivity", "الحساسية")}
      description={description}
      placeholder={translate("e.g. 1.25", "مثال: 1.25")}
      min={1}
      step={0.05}
      decimalScale={SENSITIVITY_DECIMALS}
      clampBehavior="none"
      allowNegative={false}
      suffix={locale === "ar" ? " ×" : " x"}
      radius="md"
    />
  );
}
