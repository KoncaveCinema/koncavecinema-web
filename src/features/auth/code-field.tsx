// Client code without its own "use client": only client forms import it, so its callbacks never
// cross from the server.

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

/**
 * Six digits in six separate boxes, centred, for the emailed code and the authenticator app's.
 * Digits only, a pasted code fills every box, and phones offer the code from the message.
 */
export function CodeField({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** All six typed: forms send at once, rather than waiting for a press */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      pattern="^[0-9]*$"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      containerClassName="w-full justify-center"
    >
      {/* Six equal boxes that share the width they're given (a narrow dialog, a phone), up to
          56px each. Each box turns red by itself when the code is wrong: no frame around all six */}
      <InputOTPGroup className="grid w-full max-w-88 grid-cols-6 gap-2 has-aria-invalid:border-transparent has-aria-invalid:ring-0 sm:gap-3 dark:has-aria-invalid:ring-0">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid || undefined}
            className="aspect-square size-auto w-full rounded-xl border border-white/12 bg-white/4 font-display text-xl font-black first:rounded-xl first:border-l last:rounded-xl data-[active=true]:border-brand data-[active=true]:ring-brand/30 sm:text-2xl dark:bg-white/4"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

/** True once six digits are typed */
export const isSixDigits = (value: string) => /^\d{6}$/.test(value);
