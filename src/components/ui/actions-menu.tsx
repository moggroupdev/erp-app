"use client";

import { Children, isValidElement } from "react";
import { Button, Menu } from "@mantine/core";
import { Menu as MenuIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export default function ActionsMenu({ children, color }: { children: React.ReactNode; color?: string }) {
  const { translate } = useI18n();
  const items = Children.toArray(children).filter((child) => {
    if (child == null || typeof child === "boolean") return false;
    if (typeof child === "string") return child.trim().length > 0;
    return isValidElement(child);
  });

  if (items.length === 0) return null;

  return (
    <Menu offset={8} withinPortal withArrow>
      <Menu.Target>
        <Button variant="light" color={color} radius="md" px="sm" aria-label={translate("Actions", "الإجراءات")}>
          <MenuIcon size={15} />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>{items}</Menu.Dropdown>
    </Menu>
  );
}
