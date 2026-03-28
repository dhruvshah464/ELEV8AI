"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { getPostAuthPath, sanitizeRedirectPath } from "@/lib/auth/routes";
import { AUTH_OTP_LENGTH, normalizeEmail, normalizeOtpToken } from "@/lib/auth/otp";

type EmailOtpType = "signup" | "email";

interface AuthActionResult {
  error: Error | null;
  redirectTo?: string | null;
  requiresVerification?: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signInWithPassword: (
    email: string,
    password: string,
    nextPath?: string | null
  ) => Promise<AuthActionResult>;
  signUpWithPassword: (
    email: string,
    password: string,
    options?: { fullName?: string; nextPath?: string | null }
  ) => Promise<AuthActionResult>;
  sendLoginOTP: (email: string) => Promise<{ error: Error | null }>;
  sendSignupOTP: (
    email: string,
    options?: { fullName?: string }
  ) => Promise<{ error: Error | null }>;
  resendSignupVerification: (
    email: string
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (nextPath?: string | null) => Promise<{ error: Error | null }>;
  verifyOTP: (
    email: string,
    token: string,
    options?: { type?: EmailOtpType; nextPath?: string | null }
  ) => Promise<{ data: Session | null; error: Error | null; redirectTo?: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

type AuthApiResponse = {
  ok: boolean;
  error?: string;
  redirectTo?: string | null;
  cooldownSeconds?: number;
  debug?: {
    requestId?: string;
    retryAfterSeconds?: number;
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });
  const supabaseRef = useRef(createClient());

  async function fetchProfile(
    user: User
  ): Promise<Profile | null> {
    const supabase = supabaseRef.current;
    const userId = user.id;
    const userEmail = user.email ?? "";
    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[AUTH] Failed to fetch profile:", error);
      }

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              email: userEmail,
              full_name: fullName,
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        if (insertError) {
          console.error("[AUTH] Failed to create profile:", insertError);
          return null;
        }

        return newData as Profile | null;
      }

      if (!data.full_name && fullName) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, updated_at: new Date().toISOString() })
          .eq("id", userId)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          return updatedProfile as Profile;
        }
      }

      return data as Profile | null;
    } catch (err) {
      console.error("[AUTH] Unexpected profile error:", err);
      return null;
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);

  const syncSession = useCallback(async (session: Session | null) => {
    const user = session?.user ?? null;
    const profile = user ? await fetchProfile(user) : null;

    const nextState: AuthState = {
      user,
      session,
      profile,
      loading: false,
    };

    setState(nextState);
    return nextState;
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    let isMounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        await syncSession(session);
      } catch (err) {
        console.error("[AUTH] Failed to initialize session:", err);
        if (isMounted) {
          setState({ user: null, session: null, profile: null, loading: false });
        }
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!isMounted) return;

      void syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const getRedirectAfterSession = useCallback(
    async (session: Session | null, nextPath?: string | null) => {
      const nextState = await syncSession(session);
      return getPostAuthPath({
        onboarded: nextState.profile?.onboarded,
        nextPath,
      });
    },
    [syncSession]
  );

  const buildCallbackUrl = (nextPath?: string | null) => {
    const safeNext = sanitizeRedirectPath(nextPath);
    const callbackUrl = new URL("/auth/callback", window.location.origin);

    if (safeNext) {
      callbackUrl.searchParams.set("next", safeNext);
    }

    return callbackUrl.toString();
  };

  const syncSessionFromBrowser = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return syncSession(session);
  }, [syncSession]);

  const postAuthJson = async (
    url: string,
    body: Record<string, unknown>
  ): Promise<AuthApiResponse> => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await response.json()) as AuthApiResponse;
    return json;
  };

  const sendEmailOTP = async (
    email: string,
    options?: {
      shouldCreateUser?: boolean;
      fullName?: string;
    }
  ) => {
    const normalizedEmail = normalizeEmail(email);

    try {
      const result = await postAuthJson("/api/auth/otp/request", {
        email: normalizedEmail,
        mode: options?.shouldCreateUser ? "signup" : "login",
        fullName: options?.fullName?.trim() || undefined,
      });

      if (!result.ok) {
        return {
          error: new Error(
            result.debug?.requestId
              ? `${result.error ?? "Unable to send OTP."} (request ${result.debug.requestId})`
              : result.error ?? "Unable to send OTP."
          ),
        };
      }

      console.info("[AUTH] OTP request sent", {
        email: normalizedEmail,
        mode: options?.shouldCreateUser ? "signup" : "login",
        requestId: result.debug?.requestId,
      });

      return { error: null };
    } catch (err: unknown) {
      return {
        error: new Error(
          err instanceof Error ? err.message : "Something went wrong"
        ),
      };
    }
  };

  const signInWithPassword = async (
    email: string,
    password: string,
    nextPath?: string | null
  ): Promise<AuthActionResult> => {
    const supabase = supabaseRef.current;
    const normalizedEmail = normalizeEmail(email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      const redirectTo = await getRedirectAfterSession(data.session, nextPath);
      return { error: null, redirectTo };
    } catch (err: unknown) {
      return {
        error: new Error(
          err instanceof Error ? err.message : "Unable to sign in"
        ),
      };
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    options?: { fullName?: string; nextPath?: string | null }
  ): Promise<AuthActionResult> => {
    const supabase = supabaseRef.current;
    const normalizedEmail = normalizeEmail(email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: options?.fullName ? { full_name: options.fullName } : undefined,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.session) {
        const redirectTo = await getRedirectAfterSession(
          data.session,
          options?.nextPath
        );

        return { error: null, redirectTo };
      }

      return { error: null, requiresVerification: true };
    } catch (err: unknown) {
      return {
        error: new Error(
          err instanceof Error ? err.message : "Unable to create account"
        ),
      };
    }
  };

  const sendLoginOTP = async (email: string) =>
    sendEmailOTP(email, { shouldCreateUser: false });

  const sendSignupOTP = async (
    email: string,
    options?: { fullName?: string }
  ) =>
    sendEmailOTP(email, {
      shouldCreateUser: true,
      fullName: options?.fullName,
    });

  const resendSignupVerification = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);

    try {
      const result = await postAuthJson("/api/auth/signup/resend", {
        email: normalizedEmail,
      });

      if (!result.ok) {
        return {
          error: new Error(
            result.debug?.requestId
              ? `${result.error ?? "Unable to resend verification."} (request ${result.debug.requestId})`
              : result.error ?? "Unable to resend verification."
          ),
        };
      }

      console.info("[AUTH] Signup verification resent", {
        email: normalizedEmail,
        requestId: result.debug?.requestId,
      });

      return { error: null };
    } catch (err: unknown) {
      return {
        error: new Error(
          err instanceof Error ? err.message : "Unable to resend verification"
        ),
      };
    }
  };

  const signInWithGoogle = async (nextPath?: string | null) => {
    const supabase = supabaseRef.current;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildCallbackUrl(nextPath),
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: new Error(
          err instanceof Error ? err.message : "Unable to start Google sign-in"
        ),
      };
    }
  };

  const verifyOTP = async (
    email: string,
    token: string,
    options?: { type?: EmailOtpType; nextPath?: string | null }
  ) => {
    try {
      const normalizedEmail = normalizeEmail(email);
      const normalizedToken = normalizeOtpToken(token);

      if (normalizedToken.length !== AUTH_OTP_LENGTH) {
        return {
          data: null,
          error: new Error(`Enter the exact ${AUTH_OTP_LENGTH}-digit OTP from your email.`),
        };
      }

      const result = await postAuthJson("/api/auth/otp/verify", {
        email: normalizedEmail,
        token: normalizedToken,
        type: options?.type === "signup" ? "signup" : "email",
        nextPath: options?.nextPath ?? null,
      });

      if (!result.ok) {
        const message =
          result.debug?.requestId
            ? `${result.error ?? "Invalid or expired OTP."} (request ${result.debug.requestId})`
            : result.error ?? "Invalid or expired OTP.";

        return {
          data: null,
          error: new Error(message),
        };
      }

      const nextState = await syncSessionFromBrowser();
      const redirectTo =
        result.redirectTo ??
        getPostAuthPath({
          onboarded: nextState.profile?.onboarded,
          nextPath: options?.nextPath,
        });

      console.info("[AUTH] OTP verification succeeded", {
        email: normalizedEmail,
        requestId: result.debug?.requestId,
      });

      return {
        data: nextState.session,
        error: null,
        redirectTo,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: new Error(
          err instanceof Error ? err.message : "Invalid OTP"
        ),
      };
    }
  };

  const signOut = async () => {
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithPassword,
        signUpWithPassword,
        sendLoginOTP,
        sendSignupOTP,
        resendSignupVerification,
        signInWithGoogle,
        verifyOTP,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
