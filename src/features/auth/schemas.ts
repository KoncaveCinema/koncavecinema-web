import { z } from "zod";

/*
 * Form rules mirrored from the API's DTOs, so most mistakes are caught before a request is sent.
 * The API validates again and has the final word.
 */

export const emailSchema = z.email("Enter a valid email address").max(254);

/** RegisterDto: 8–100 characters, an uppercase and a lowercase letter, and a number or symbol */
export const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(100, "Use at most 100 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[\d\W]/, "Add a number or a symbol");

/** The same rules as checks, for the live checklist under the password field */
export const PASSWORD_RULES = [
  { label: "8 or more characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number or symbol", test: (value: string) => /[\d\W]/.test(value) },
];

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  acceptTerms: z.literal(true, { error: "Please accept the terms to continue" }),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ newPassword: newPasswordSchema, confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The passwords don't match",
    path: ["confirmPassword"],
  });

/** SendOtpDto: Nigerian mobile numbers, 080… or +234… */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?234|0)[789][01]\d{8}$/, "Enter a Nigerian mobile number, like 0803 123 4567");

/** VerifyKycDto */
export const verifyIdentitySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  legalFullName: z.string().trim().min(3, "Enter your full name as it appears on your ID").max(100),
  publicScreenAlias: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(25, "Use at most 25 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscores and hyphens only"),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type VerifyIdentityValues = z.infer<typeof verifyIdentitySchema>;
