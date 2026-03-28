"use client";

import { useEffect, useRef, useState } from "react";
import { AUTH_OTP_LENGTH } from "@/lib/auth/otp";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = AUTH_OTP_LENGTH,
  autoFocus = false,
  disabled = false,
  invalid = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));

  useEffect(() => {
    setDigits(Array.from({ length }, (_, index) => value[index] ?? ""));
  }, [length, value]);

  useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  const focusIndex = (index: number) => {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  };

  const updateDigits = (nextDigits: string[]) => {
    setDigits(nextDigits);
    onChange(nextDigits.join(""));
  };

  const fillFromIndex = (index: number, rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, "").slice(0, length - index);
    if (!sanitized) return;

    const nextDigits = [...digits];
    sanitized.split("").forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    updateDigits(nextDigits);
    focusIndex(Math.min(index + sanitized.length, length - 1));
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => {
            const sanitized = event.target.value.replace(/\D/g, "");

            if (!sanitized) {
              const nextDigits = [...digits];
              nextDigits[index] = "";
              updateDigits(nextDigits);
              return;
            }

            if (sanitized.length > 1) {
              fillFromIndex(index, sanitized);
              return;
            }

            const nextDigits = [...digits];
            nextDigits[index] = sanitized;
            updateDigits(nextDigits);

            if (index < length - 1) {
              focusIndex(index + 1);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              const nextDigits = [...digits];

              if (nextDigits[index]) {
                nextDigits[index] = "";
                updateDigits(nextDigits);
                return;
              }

              if (index > 0) {
                nextDigits[index - 1] = "";
                updateDigits(nextDigits);
                focusIndex(index - 1);
              }
            }

            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              focusIndex(index - 1);
            }

            if (event.key === "ArrowRight" && index < length - 1) {
              event.preventDefault();
              focusIndex(index + 1);
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            fillFromIndex(index, event.clipboardData.getData("text"));
          }}
          className={cn(
            "h-14 w-12 rounded-2xl border text-center font-mono text-xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition sm:w-14",
            invalid
              ? "border-rose-400/35 bg-rose-400/[0.08] focus:border-rose-300"
              : "border-white/10 bg-white/[0.05] focus:border-cyan-300/40 focus:bg-white/[0.08]",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      ))}
    </div>
  );
}
