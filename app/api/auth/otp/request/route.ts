import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import {
  getClientIp,
  normalizeEmail,
  normalizeOtpErrorMessage,
} from "@/lib/auth/otp";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email(),
  mode: z.enum(["login", "signup"]),
  fullName: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = new NextResponse();
  const supabase = createRouteSupabaseClient(request, response);

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please enter a valid email address.",
          debug: { requestId },
        },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`otp:request:${ip}:${email}`, {
      maxRequests: 4,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      console.warn(
        `[AUTH OTP REQUEST] requestId=${requestId} blocked rate_limit email=${email} ip=${ip}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Too many OTP requests. Please wait before trying again.",
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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: parsed.data.mode === "signup",
        data: parsed.data.fullName
          ? { full_name: parsed.data.fullName.trim() }
          : undefined,
      },
    });

    if (error) {
      console.error(
        `[AUTH OTP REQUEST] requestId=${requestId} failed email=${email} ip=${ip} error=${error.message}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: normalizeOtpErrorMessage(error.message),
          debug: { requestId },
        },
        { status: 400 }
      );
    }

    console.info(
      `[AUTH OTP REQUEST] requestId=${requestId} success email=${email} mode=${parsed.data.mode} ip=${ip}`
    );

    return NextResponse.json({
      ok: true,
      cooldownSeconds: 60,
      debug: { requestId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected OTP request failure.";
    console.error(`[AUTH OTP REQUEST] requestId=${requestId} unexpected=${message}`);
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
