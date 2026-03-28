import type { NextRequest } from "next/server";

export const AUTH_OTP_LENGTH = 8;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeOtpToken(token: string) {
  return token.replace(/\D/g, "").slice(0, AUTH_OTP_LENGTH);
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function normalizeOtpErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("invalid otp") ||
    normalized.includes("token has expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("invalid_token")
  ) {
    return "Invalid or expired OTP. Request a fresh code and try again.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many OTP attempts. Please wait and try again.";
  }

  if (
    normalized.includes("failed to send email") ||
    normalized.includes("error sending confirmation email") ||
    normalized.includes("smtp")
  ) {
    return "We could not deliver the OTP email. Please try again in a moment.";
  }

  if (normalized.includes("network")) {
    return "Network issue while contacting auth services. Please retry.";
  }

  return message;
}
