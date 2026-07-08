import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";

const title = {
  en: "Terms and Conditions",
  ar: "الشروط والأحكام",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "terms-and-conditions",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1">
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-4">{translate(title.en, title.ar)}</h1>
        <section id="privacy-intro" className="mb-8">
          <p>
            {translate(
              "Please read these terms and conditions carefully before ordering any products from our website.",
              "يرجى قراءة هذه الشروط والأحكام بعناية قبل طلب أي منتجات من موقعنا على الإنترنت.",
            )}
          </p>
        </section>

        <hr className="mb-8 border-gray-200" />
      </div>
    </div>
  );
}
