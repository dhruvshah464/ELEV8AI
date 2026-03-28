import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_PAGES,
  ONBOARDING_PATH,
  PROTECTED_PATHS,
  buildLoginPath,
  getPostAuthPath,
  matchesPath,
} from "@/lib/auth/routes";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedRoute = matchesPath(pathname, PROTECTED_PATHS);
  const isAuthPage = matchesPath(pathname, AUTH_PAGES);
  const isOnboardingRoute =
    pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);

  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url));
  }

  if (!user) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  const postAuthPath = getPostAuthPath({
    onboarded: profile?.onboarded,
    nextPath: request.nextUrl.searchParams.get("next"),
  });

  if (isAuthPage) {
    return NextResponse.redirect(new URL(postAuthPath, request.url));
  }

  if (isProtectedRoute && !profile?.onboarded) {
    return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
  }

  if (isOnboardingRoute && profile?.onboarded) {
    return NextResponse.redirect(
      new URL(getPostAuthPath({ onboarded: true }), request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
