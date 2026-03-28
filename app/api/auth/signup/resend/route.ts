import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  getClientIp,
  normalizeEmail,
  normalizeOtpErrorMessage,
} from "@/lib/auth/otp";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = new NextResponse();
  const supabase = createRouteSupabaseClient(request, response);

  try {
    const parsed = resendSchema.safeParse(await request.json());
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
    const rateLimit = checkRateLimit(`signup:resend:${ip}:${email}`, {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many resend attempts. Please wait before trying again.",
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

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error(
        `[AUTH SIGNUP RESEND] requestId=${requestId} failed email=${email} ip=${ip} error=${error.message}`
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
      `[AUTH SIGNUP RESEND] requestId=${requestId} success email=${email} ip=${ip}`
    );
    return NextResponse.json({
      ok: true,
      cooldownSeconds: 60,
      debug: { requestId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected resend failure.";
    console.error(`[AUTH SIGNUP RESEND] requestId=${requestId} unexpected=${message}`);
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
