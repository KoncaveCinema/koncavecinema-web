"use client";

import { Check, Eye, EyeOff, FlaskConical } from "lucide-react";
import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PASSWORD_RULES } from "./schemas";
import { isDemo } from "./service";

/* Form pieces shared by the sign-in, registration, password and identity-check forms. */

export const fieldClass =
  "h-12 w-full rounded-xl border border-white/12 bg-white/3 px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-brand focus-visible:bg-white/5 aria-invalid:border-destructive";

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-white/80">
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
    >
      {children}
    </p>
  );
}

/** A password field with a show/hide toggle */
export const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(fieldClass, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);

/** The password rules as a live checklist under a new-password field */
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs min-[380px]:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-lobby" : "text-muted-foreground",
            )}
          >
            <Check className={cn("size-3.5", !met && "opacity-30")} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Sample-data mode only: how to reach each state without the API */
export function DemoHint({ children }: { children: ReactNode }) {
  if (!isDemo) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-dashed border-sky-400/30 bg-sky-400/5 px-3.5 py-2.5 text-xs text-sky-200/80">
      <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
      {children}
    </p>
  );
}

/** Only same-site paths are followed after signing in, never another origin */
export function safeNext(value: string | null, fallback = "/movies"): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function AuthHeading({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
