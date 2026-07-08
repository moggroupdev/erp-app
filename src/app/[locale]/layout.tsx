import "@mantine/core/styles.css";
import "@/app/globals.css";

import type { LocaleLayoutProps } from "@/lib/i18n/types";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { locales } from "@/lib/i18n/config";
import { Tajawal } from "next/font/google";
import UserProvider from "@/contexts/user/provider";
import LocationsProvider from "@/contexts/locations/provider";
import DepartmentsProvider from "@/contexts/departments/provider";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

// Generate static paths for each locale at build time (SSG)
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ params, children }: Readonly<LocaleLayoutProps>) {
  const { locale, translation } = await getI18nFromParams(params);

  return (
    <html lang={locale} dir={translation.dir} {...mantineHtmlProps} className={tajawal.variable}>
      <head>
        <ColorSchemeScript />
      </head>
      <body style={{ height: "101vh" }}>
        <LocationsProvider>
          <UserProvider>
            <DepartmentsProvider>
              <MantineProvider>{children}</MantineProvider>
            </DepartmentsProvider>
          </UserProvider>
        </LocationsProvider>
      </body>
    </html>
  );
}
