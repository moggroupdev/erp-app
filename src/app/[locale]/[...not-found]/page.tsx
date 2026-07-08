import { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { notFound } from "next/navigation";

const title = { en: "Page Not Found", ar: "الصفحة غير موجودة" };

export const generateMetadata = async ({ params }: LocalePageProps) => {
  const { translate } = await getI18nFromParams(params);

  return { title: translate(title.en, title.ar) };
};

export default function Page() {
  notFound();
}
