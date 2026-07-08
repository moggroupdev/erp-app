"use client";

import Link from "next/link";
import { Circle } from "lucide-react";
import type { Link as LinkType } from "./options";
import { useLocale } from "@/lib/i18n/hooks";
import { createTranslator } from "@/lib/i18n/utils";
import { usePathname } from "next/navigation";

export default function AdminNavLink({
  link: { href, label, Icon, nestedLinks },
  onClick,
}: {
  link: LinkType;
  onClick?: () => void;
}) {
  const locale = useLocale();
  const translate = createTranslator(locale);

  const pathname = usePathname();

  const isActive = pathname.includes(href);

  return (
    <div>
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-5 px-5 py-2.5 text-base ${isActive ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
      >
        {Icon}
        <div>{label}</div>
      </Link>

      {/* Nested links */}
      {isActive && nestedLinks && (
        <div className="my-0.5 flex flex-col">
          {nestedLinks.map((nestedLink) => {
            const isActiveNestLink = pathname.includes(nestedLink.href);
            return (
              <Link
                key={nestedLink.href}
                href={nestedLink.href}
                onClick={onClick}
                className={`flex items-center gap-4 py-[7.15px] text-sm ${translate("pl-7", "pl-7 sm:pr-7")} ${isActiveNestLink ? "bg-blue-100 text-sky-600" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
              >
                <Circle size={4} fill="currentColor" strokeWidth={0} />
                <div>{nestedLink.label}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
