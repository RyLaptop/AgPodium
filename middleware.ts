import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const UNI_EXEMPT = ["/", "/login", "/signup", "/auth", "/invite", "/api"];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isExempt = UNI_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isExempt && !request.cookies.get("uni")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
