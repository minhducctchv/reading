import { NextResponse } from "next/server";

const LOCALES = ["en", "vi"];
const DEFAULT_LOCALE = "en";

function getLocale(request) {
  // Mặc định luôn là 'en', chỉ đổi khi user đã chủ động chọn qua cookie NEXT_LOCALE
  const localeCookie = request.cookies.get("NEXT_LOCALE");
  if (localeCookie && LOCALES.includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return DEFAULT_LOCALE;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Bỏ qua static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/_pagefind")
  ) {
    return NextResponse.next();
  }

  // Kiểm tra auth (bỏ qua login và api/auth)
  if (!pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
    const authCookie = request.cookies.get("auth");
    if (!authCookie || authCookie.value !== "true") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect về locale nếu chưa có prefix
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (
    !pathnameHasLocale &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/api")
  ) {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
