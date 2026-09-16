"use client";

import { MantineProvider } from "@mantine/core";
import { cssVariablesResolver, theme } from "@/components/mantine/theme";

export default function MantineThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      {children}
    </MantineProvider>
  );
}
