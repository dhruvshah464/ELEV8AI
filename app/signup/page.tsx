import { AuthPage } from "@/components/auth/auth-page";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage mode="signup" nextPath={params.next} />;
}
