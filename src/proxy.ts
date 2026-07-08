import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { handleLocalization } from "@/middlewares/localization.middleware";

export async function proxy(request: NextRequest) {
  const localeResponse = handleLocalization(request);
  if (localeResponse) return localeResponse;

  return NextResponse.next();
}

// ============================================================================
// Matcher Configuration
// ============================================================================

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - /api routes
    // - /_next (Next.js internals)
    // - /_static (static files)
    // - /_vercel (Vercel internals)
    // - /favicon.ico, /robots.txt, etc. (static files)
    "/((?!api|_next|_static|_vercel|favicon.ico|robots.txt|.*\\..*|[\\w-]+\\.\\w+).*)",
  ],
};
