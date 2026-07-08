"use client";

import { useLocale } from "@/lib/i18n/hooks";
import { translate } from "@/lib/i18n/utils";
import { Modal as M } from "@mantine/core";

export default function Modal({
  opened,
  onClose,
  title = "",
  centerTitle = false,
  size = "md",
  children,
}: {
  opened: boolean;
  onClose: () => void;
  title?: string;
  centerTitle?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  const locale = useLocale();

  return (
    <M
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      radius={20}
      dir={translate(locale, "ltr", "rtl")}
      size={size}
    >
      <div className="p-2.5">
        {title && <h3 className={`mb-2.5 ${centerTitle ? "text-center" : ""}`}>{title}</h3>}
        {children}
      </div>
    </M>
  );
}
