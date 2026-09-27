"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import useHasPermission from "@/hooks/use-has-permission";
import type { Permission } from "@/lib/constants/enums/permissions";
import { useLocaleHref } from "@/lib/i18n/hooks";

function withoutHoverClasses(className?: string) {
  if (!className) return undefined;

  const kept = className
    .split(/\s+/)
    .filter((token) => token && token !== "group" && !token.includes("hover:"))
    .join(" ");

  return kept || undefined;
}

export default function ProtectedLink({
  permission,
  href,
  className,
  title,
  children,
}: {
  permission: Permission | readonly Permission[];
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const hasPermission = useHasPermission(permission);
  const getLocalizedHref = useLocaleHref();

  if (!hasPermission)
    return (
      <span className={withoutHoverClasses(className)} title={title}>
        {children}
      </span>
    );

  return (
    <Link href={getLocalizedHref(href)} className={className} title={title}>
      {children}
    </Link>
  );
}
