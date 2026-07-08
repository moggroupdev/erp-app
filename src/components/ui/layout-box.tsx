"use client";

import { useLocale } from "@/lib/i18n/hooks";
import { useRouter } from "next/navigation";
import { getI18n } from "@/lib/i18n/utils";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";

export default function LayoutBox({
  header,
  children,
}: {
  header?: {
    title: string;
    subTitle?: string;
    backLink?: string | boolean;
    sideElements?: React.ReactNode;
    border?: boolean;
  };
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { translate, translation } = getI18n(locale);

  const router = useRouter();

  return (
    <div className="root-flex-1 flex min-h-full flex-col gap-4 rounded-[20px] bg-white p-4 shadow-lg sm:p-6">
      {header && (
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {header.backLink && (
                <Button
                  onClick={() => {
                    if (typeof header.backLink === "string") router.push(header.backLink);
                    else if (header.backLink === true) router.back();
                  }}
                  title={translation.back}
                  variant="light"
                  color="dark"
                  radius={20}
                  p={0}
                  h={40}
                  w={40}
                >
                  <ArrowLeft style={{ transform: `rotateY(${translate("0", "180deg")})` }} />
                </Button>
              )}
              <h1>{header.title}</h1>
            </div>
            {header.subTitle && <p>{header.subTitle}</p>}
          </div>
          {header.sideElements && header.sideElements}
        </header>
      )}

      {header?.border && <hr />}

      {children}
    </div>
  );
}
