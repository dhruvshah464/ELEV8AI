import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthPath, sanitizeRedirectPath } from "@/lib/auth/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const otpType =
    rawType === "signup" ||
    rawType === "invite" ||
    rawType === "magiclink" ||
    rawType === "recovery" ||
    rawType === "email_change" ||
    rawType === "email"
      ? rawType
      : null;

  const redirectUrl = new URL("/dashboard", origin);
  const supabaseResponse = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email ?? "",
              full_name:
                typeof user.user_metadata?.full_name === "string"
                  ? user.user_metadata.full_name
                  : null,
            },
            { onConflict: "id" }
          )
          .select("onboarded")
          .single();

        const destination = getPostAuthPath({
          onboarded: profile?.onboarded,
          nextPath: next,
        });

        supabaseResponse.headers.set(
          "Location",
          new URL(destination, origin).toString()
        );

        return supabaseResponse;
      }

      return supabaseResponse;
    }
  }

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email ?? "",
              full_name:
                typeof user.user_metadata?.full_name === "string"
                  ? user.user_metadata.full_name
                  : null,
            },
            { onConflict: "id" }
          )
          .select("onboarded")
          .single();

        const destination = getPostAuthPath({
          onboarded: profile?.onboarded,
          nextPath: next,
        });

        supabaseResponse.headers.set(
          "Location",
          new URL(destination, origin).toString()
        );

        return supabaseResponse;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
