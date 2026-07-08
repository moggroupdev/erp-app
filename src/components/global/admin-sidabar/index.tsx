"use client";

import { useLocale } from "@/lib/i18n/hooks";
import { getTranslation } from "@/lib/i18n/utils";
import Logo from "@/components/global/logo";
import AdminSidebarOptions from "./components/options";

export default function AdminSidebar({ width }: { width: number }) {
  const locale = useLocale();
  const translation = getTranslation(locale);

  return (
    <aside style={{ width: `${width}px` }}>
      <div
        style={{ width: `${width}px` }}
        className="fixed z-10 flex h-screen flex-col overflow-y-auto border-x border-gray-200 bg-white"
      >
        <header className="p-4">
          <Logo title={translation.dashboard} />
        </header>
        <hr className="border-gray-200" />
        <AdminSidebarOptions />
      </div>
    </aside>
  );
}
