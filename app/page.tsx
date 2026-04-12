import { createServerSupabase } from "@/lib/supabase/server";
import { getPostAuthPath } from "@/lib/auth/routes";
import LandingExperience from "@/components/landing/landing-experience";

export default async function LandingPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const ctaLink = user
    ? getPostAuthPath({ onboarded: profile?.onboarded })
    : "/signup";
  const secondaryLink = user ? "/dashboard" : "/login";
  const isAuthenticated = Boolean(user);

  return (
    <LandingExperience
      ctaLink={ctaLink}
      secondaryLink={secondaryLink}
      isAuthenticated={isAuthenticated}
    />
  );
}
