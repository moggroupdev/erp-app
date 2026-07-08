import type { Metadata } from "next";
import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { translation } = await getI18nFromParams(params);
  return { title: translation.appTitle, description: translation.appDescription };
}

export default async function page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1">
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-4">{translate("Home", "الصفحة الرئيسية")}</h1>
        <p>{translation.underConstruction}</p>
      </div>
    </div>
  );
}
