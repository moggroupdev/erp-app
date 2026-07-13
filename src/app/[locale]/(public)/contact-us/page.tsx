import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";

const title = {
  en: "Contact Us",
  ar: "تواصل معنا",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "contact-us",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1">
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-4">{translate(title.en, title.ar)}</h1>
        <p>{translation.noDataAvailable}</p>
      </div>
    </div>
  );
}
