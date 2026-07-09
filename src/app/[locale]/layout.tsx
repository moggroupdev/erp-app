import "@mantine/core/styles.css";
import "@/app/globals.css";

import type { LocaleLayoutProps } from "@/lib/i18n/types";
import { createTheme, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { MantineColorSchemeScript } from "@/components/mantine/color-scheme-script";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { locales } from "@/lib/i18n/config";
import { Alexandria } from "next/font/google";
import UserProvider from "@/contexts/user/provider";
import LocationsProvider from "@/contexts/locations/provider";
import DepartmentsProvider from "@/contexts/departments/provider";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
});

const theme = createTheme({
  fontFamily: "var(--font-alexandria)",
  headings: { fontFamily: "var(--font-alexandria)" },
});

// Generate static paths for each locale at build time (SSG)
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ params, children }: Readonly<LocaleLayoutProps>) {
  const { locale, translation } = await getI18nFromParams(params);

  return (
    <html
      lang={locale}
      dir={translation.dir}
      className={`${alexandria.variable} ${alexandria.className}`}
      {...mantineHtmlProps}
    >
      <head>
        <MantineColorSchemeScript />
      </head>
      <body style={{ height: "101vh" }}>
        <LocationsProvider>
          <UserProvider>
            <DepartmentsProvider>
              <MantineProvider theme={theme}>{children}</MantineProvider>
            </DepartmentsProvider>
          </UserProvider>
        </LocationsProvider>
      </body>
    </html>
  );
}
