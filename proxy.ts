import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only (cookie present). Real validation happens in the API routes.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|login|register|.*\\.svg$).*)",
  ],
};
