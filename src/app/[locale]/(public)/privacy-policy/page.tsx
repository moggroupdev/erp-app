import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";

const title = {
  en: "Privacy Policy",
  ar: "سياسة الخصوصية",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "privacy-policy",
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
              "This Privacy Policy outlines how we collect, use, and protect your personal information when you visit our website or use our services.",
              "توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عندما تزور موقعنا الإلكتروني أو تستخدم خدماتنا.",
            )}
          </p>
        </section>

        <hr className="mb-8 border-gray-200" />
      </div>
    </div>
  );
}
