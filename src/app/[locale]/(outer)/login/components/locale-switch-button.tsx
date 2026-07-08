"use client";

import { Button } from "@mantine/core";
import { Globe } from "lucide-react";
import { localeNames } from "@/lib/i18n/config";
import { useLocaleSwitch } from "@/lib/i18n/hooks";

export default function LocaleSwitchButton() {
  const { nextLocale, switchLocale } = useLocaleSwitch();

  return (
    <Button
      type="button"
      variant="light"
      color="dark"
      size="sm"
      radius="lg"
      leftSection={<Globe size={14} />}
      onClick={() => switchLocale()}
    >
      {localeNames[nextLocale]}
    </Button>
  );
}
