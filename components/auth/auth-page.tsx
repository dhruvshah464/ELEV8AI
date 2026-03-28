"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { getPostAuthPath, sanitizeRedirectPath } from "@/lib/auth/routes";
import { AUTH_OTP_LENGTH } from "@/lib/auth/otp";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthPageMode = "login" | "signup";
type AuthMethod = "password" | "otp";
type VerificationSource = "login-otp" | "signup-otp" | "signup-password";
type VerificationState = {
  email: string;
  source: VerificationSource;
  type: "email" | "signup";
} | null;

interface AuthPageProps {
  mode: AuthPageMode;
  nextPath?: string | null;
}

const authHighlights = [
  {
    title: "AI mentor in the loop",
    description: "Persistent guidance, streaming responses, and execution-focused coaching.",
  },
  {
    title: "Mission-driven workflow",
    description: "Users move from onboarding into a focused dashboard, not a dead-end profile page.",
  },
  {
    title: "Premium auth UX",
    description: "Password, OTP, and Google stay in one clean flow without redirect chaos.",
  },
];

export function AuthPage({ mode, nextPath }: AuthPageProps) {
  const router = useRouter();
  const safeNextPath = sanitizeRedirectPath(nextPath);
  const nextQuery = safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : "";

  const {
    user,
    profile,
    loading: authLoading,
    signInWithPassword,
    signUpWithPassword,
    sendLoginOTP,
    sendSignupOTP,
    resendSignupVerification,
    signInWithGoogle,
    verifyOTP,
  } = useAuth();

  const [method, setMethod] = useState<AuthMethod>("password");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verification, setVerification] = useState<VerificationState>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          setCanResend(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    setFormError(null);
  }, [email, fullName, method, otp, password, verification]);

  useEffect(() => {
    if (authLoading || !user) return;

    router.replace(
      getPostAuthPath({
        onboarded: profile?.onboarded,
        nextPath: safeNextPath,
      })
    );
  }, [authLoading, user, profile, safeNextPath, router]);

  const pageCopy = useMemo(() => {
    const isLogin = mode === "login";

    return {
      title: isLogin ? "Welcome back" : "Create your account",
      description: isLogin
        ? "Sign in with password, one-time code, or Google."
        : "Start with password, a one-time code, or Google.",
      googleLabel: isLogin ? "Continue with Google" : "Sign up with Google",
      passwordButton: isLogin ? "Sign in with password" : "Create account",
      otpButton: isLogin ? "Send login code" : "Send signup code",
      alternateLabel: isLogin ? "New user?" : "Already have an account?",
      alternateCta: isLogin ? "Sign up" : "Log in",
      alternateHref: isLogin ? `/signup${nextQuery}` : `/login${nextQuery}`,
    };
  }, [mode, nextQuery]);

  const startResendCooldown = () => {
    setCanResend(false);
    setResendTimer(60);
  };

  const handleAuthRedirect = (redirectTo?: string | null) => {
    router.replace(
      redirectTo ??
        getPostAuthPath({ onboarded: false, nextPath: safeNextPath })
    );
  };

  const handleGoogle = async () => {
    if (loading) return;

    setLoading(true);
    setFormError(null);
    const { error } = await signInWithGoogle(safeNextPath);
    setLoading(false);

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setFormError(null);

    if (mode === "login") {
      const { error, redirectTo } = await signInWithPassword(
        email.trim(),
        password,
        safeNextPath
      );

      setLoading(false);

      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }

      toast.success("Signed in successfully.");
      handleAuthRedirect(redirectTo);
      return;
    }

    const { error, redirectTo, requiresVerification } = await signUpWithPassword(
      email.trim(),
      password,
      {
        fullName: fullName.trim(),
        nextPath: safeNextPath,
      }
    );

    setLoading(false);

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    if (requiresVerification) {
      setVerification({
        email: email.trim(),
        source: "signup-password",
        type: "signup",
      });
      setOtp("");
      startResendCooldown();
      toast.success(`Verification code sent. Enter the latest ${AUTH_OTP_LENGTH}-digit OTP from your email.`);
      return;
    }

    toast.success("Account created successfully.");
    handleAuthRedirect(redirectTo);
  };

  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setFormError(null);

    const action =
      mode === "login"
        ? sendLoginOTP(email.trim())
        : sendSignupOTP(email.trim(), { fullName: fullName.trim() });

    const { error } = await action;
    setLoading(false);

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    setVerification({
      email: email.trim(),
      source: mode === "login" ? "login-otp" : "signup-otp",
      type: "email",
    });
    setOtp("");
    startResendCooldown();
    toast.success("One-time code sent. Use the latest email only.");
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verification || loading) return;

    if (otp.trim().length < AUTH_OTP_LENGTH) {
      const message = `Enter the exact ${AUTH_OTP_LENGTH}-digit OTP from your email.`;
      setFormError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setFormError(null);
    const { error, redirectTo } = await verifyOTP(verification.email, otp.trim(), {
      type: verification.type,
      nextPath: safeNextPath,
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    toast.success(mode === "login" ? "Signed in successfully." : "Email verified.");
    handleAuthRedirect(redirectTo);
  };

  const handleResend = async () => {
    if (!verification || !canResend || loading) return;

    setLoading(true);
    setFormError(null);

    const { error } =
      verification.source === "signup-password"
        ? await resendSignupVerification(verification.email)
        : verification.source === "login-otp"
          ? await sendLoginOTP(verification.email)
          : await sendSignupOTP(verification.email, {
              fullName: fullName.trim(),
            });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    startResendCooldown();
    setOtp("");
    toast.success("A fresh verification code is on the way. Older codes are no longer valid.");
  };

  if (authLoading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel-strong flex items-center gap-4 rounded-[1.5rem] px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Loading
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Preparing your secure ELEV8 access flow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen overflow-hidden px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_480px]">
        <div className="hidden lg:block">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Premium career operating system
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white">
              Sign in to the
              <span className="text-gradient-premium"> AI execution layer </span>
              for your career.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              ELEV8.AI blends planning, execution, and live AI guidance into one
              focused workspace designed to move users from intent to offers.
            </p>

            <div className="mt-8 grid gap-4">
              {authHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-sm font-semibold text-white">{highlight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center lg:max-w-none">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gradient-premium">ELEV8.AI</h1>
            <p className="mt-2 text-sm text-slate-400">
              Your AI Career Execution Engine
            </p>
          </div>

          <Card className="glass-panel-strong border-white/10">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-400/15">
                {verification ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                ) : method === "password" ? (
                  <Lock className="h-6 w-6 text-violet-200" />
                ) : (
                  <Mail className="h-6 w-6 text-cyan-200" />
                )}
              </div>
              <CardTitle className="text-xl text-white">
                {verification ? "Verify your email" : pageCopy.title}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {verification
                  ? `Enter the newest ${AUTH_OTP_LENGTH}-digit code sent to ${verification.email}. Older codes expire as soon as you resend.`
                  : pageCopy.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {formError && (
                <div className="mb-4 rounded-[1rem] border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-100">
                  {formError}
                </div>
              )}

            {verification ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">
                    Verification code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    length={AUTH_OTP_LENGTH}
                    autoFocus
                    disabled={loading}
                    invalid={Boolean(formError)}
                  />
                  <p className="text-xs text-slate-500">
                    Numeric OTP only. Request a fresh code if delivery is delayed.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.trim().length < AUTH_OTP_LENGTH}
                  className="h-11 w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Verifying..." : "Verify & continue"}
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setVerification(null);
                      setOtp("");
                      setCanResend(false);
                      setResendTimer(0);
                      setFormError(null);
                    }}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className="text-sm text-cyan-200 transition-colors hover:text-cyan-100 disabled:text-slate-500"
                  >
                    {canResend ? "Resend code" : `Resend in ${resendTimer}s`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="h-11 w-full font-medium"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {pageCopy.googleLabel}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#101726] px-2 text-slate-500">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <Tabs
                  value={method}
                  onValueChange={(value) => setMethod(value as AuthMethod)}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="otp">OTP</TabsTrigger>
                  </TabsList>

                  <TabsContent value="password">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      {mode === "signup" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">
                            Full name
                          </label>
                          <Input
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Your full name"
                            className="h-11"
                            disabled={loading}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                          Email address
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-11"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder={
                            mode === "login"
                              ? "Enter your password"
                              : "Create a strong password"
                          }
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-11"
                          required
                          minLength={6}
                          disabled={loading}
                        />
                      </div>

                      {mode === "signup" && (
                        <p className="text-xs text-slate-400">
                          We&apos;ll send a verification code to confirm your email after signup.
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={loading || !email.trim() || password.trim().length < 6}
                        className="h-11 w-full"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        {loading ? "Processing..." : pageCopy.passwordButton}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="otp">
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      {mode === "signup" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">
                            Full name
                          </label>
                          <Input
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Your full name"
                            className="h-11"
                            disabled={loading}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                          Email address
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-11"
                          required
                          disabled={loading}
                        />
                      </div>

                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <KeyRound className="h-3.5 w-3.5" />
                        {mode === "login"
                          ? "We'll send a one-time login code to your inbox."
                          : "Use an email code if you want a passwordless signup."}
                      </p>

                      <Button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="h-11 w-full"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        {loading ? "Sending code..." : pageCopy.otpButton}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-slate-400">
              {pageCopy.alternateLabel}{" "}
              <Link
                href={pageCopy.alternateHref}
                className="font-medium text-cyan-200 hover:text-cyan-100"
              >
                {pageCopy.alternateCta}
              </Link>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
