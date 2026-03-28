import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPostAuthPath, sanitizeRedirectPath } from "@/lib/auth/routes";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  AUTH_OTP_LENGTH,
  getClientIp,
  normalizeEmail,
  normalizeOtpErrorMessage,
  normalizeOtpToken,
} from "@/lib/auth/otp";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(AUTH_OTP_LENGTH).max(12),
  type: z.enum(["email", "signup"]).optional(),
  nextPath: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = new NextResponse();
  const supabase = createRouteSupabaseClient(request, response);

  try {
    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: `Enter the exact ${AUTH_OTP_LENGTH}-digit OTP from your email.`,
          debug: { requestId },
        },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const token = normalizeOtpToken(parsed.data.token);
    const ip = getClientIp(request);

    if (token.length !== AUTH_OTP_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `Enter the exact ${AUTH_OTP_LENGTH}-digit OTP from your email.`,
          debug: { requestId },
        },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(`otp:verify:${ip}:${email}`, {
      maxRequests: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      console.warn(
        `[AUTH OTP VERIFY] requestId=${requestId} blocked rate_limit email=${email} ip=${ip}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Too many verification attempts. Please wait and request a fresh OTP.",
          debug: {
            requestId,
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
            ),
          },
        },
        { status: 429 }
      );
    }

    const preferredType = parsed.data.type ?? "email";
    const typesToTry = preferredType === "signup" ? ["signup", "email"] : ["email", "signup"];

    let verificationError: string | null = null;

    for (const type of typesToTry) {
      const verification = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (!verification.error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let onboarded = false;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email ?? email,
                full_name:
                  typeof user.user_metadata?.full_name === "string"
                    ? user.user_metadata.full_name
                    : null,
              },
              { onConflict: "id" }
            )
            .select("onboarded")
            .single();

          onboarded = Boolean(profile?.onboarded);
        }

        const redirectTo = getPostAuthPath({
          onboarded,
          nextPath: sanitizeRedirectPath(parsed.data.nextPath),
        });

        console.info(
          `[AUTH OTP VERIFY] requestId=${requestId} success email=${email} type=${type} ip=${ip}`
        );

        const finalResponse = NextResponse.json({
          ok: true,
          redirectTo,
          debug: { requestId, verifiedType: type },
        });

        response.cookies.getAll().forEach(({ name, value, ...options }) => {
          finalResponse.cookies.set(name, value, options);
        });

        return finalResponse;
      }

      verificationError = verification.error.message;
    }

    console.warn(
      `[AUTH OTP VERIFY] requestId=${requestId} failed email=${email} ip=${ip} error=${verificationError}`
    );
    return NextResponse.json(
      {
        ok: false,
        error: normalizeOtpErrorMessage(
          verificationError ?? "Invalid or expired OTP."
        ),
        debug: { requestId },
      },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected OTP verification failure.";
    console.error(`[AUTH OTP VERIFY] requestId=${requestId} unexpected=${message}`);
    return NextResponse.json(
      {
        ok: false,
        error: normalizeOtpErrorMessage(message),
        debug: { requestId },
      },
      { status: 500 }
    );
  }
}
