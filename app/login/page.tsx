import { AuthPage } from "@/components/auth/auth-page";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage mode="login" nextPath={params.next} />;
}
