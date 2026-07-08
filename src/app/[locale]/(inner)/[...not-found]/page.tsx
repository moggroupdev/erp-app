import { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import { notFound } from "next/navigation";

const title = { en: "Page Not Found", ar: "الصفحة غير موجودة" };

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "dashboard",
    locale,
  });
}

export default function Page() {
  notFound();
}
