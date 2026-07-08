import "@mantine/core/styles.css";
import "@/app/globals.css";

import type { LocaleLayoutProps } from "@/lib/i18n/types";
import { createTheme, MantineProvider, mantineHtmlProps } from "@mantine/core";
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

// Server-rendered substitute for Mantine ColorSchemeScript (its client <script> trips React 19 on soft nav).
const MANTINE_COLOR_SCHEME_SCRIPT = `try {
  var _colorScheme = window.localStorage.getItem("mantine-color-scheme-value");
  var colorScheme = _colorScheme === "light" || _colorScheme === "dark" || _colorScheme === "auto" ? _colorScheme : "light";
  var computedColorScheme = colorScheme !== "auto" ? colorScheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-mantine-color-scheme", computedColorScheme);
} catch (e) {}`;

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
        <script dangerouslySetInnerHTML={{ __html: MANTINE_COLOR_SCHEME_SCRIPT }} />
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
