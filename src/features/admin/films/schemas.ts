import { z } from "zod";

/* The film forms' rules, mirroring the API's CreateMovieDto and BindNfvcbComplianceDto, so a
   mistake is caught under its field before the request is sent. */

export const AGE_RATINGS = ["G", "PG", "TWELVE_PLUS", "FIFTEEN_PLUS", "EIGHTEEN_PLUS"] as const;
export const WATERMARK_MODES = ["OFF", "SUBTLE", "STRONG"] as const;

export const filmSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give the film's title (at least 2 characters).")
    .max(255, "Keep the title under 255 characters."),
  synopsis: z.string().trim().min(10, "Write a synopsis of at least 10 characters."),
  durationMinutes: z.coerce
    .number<string | number>()
    .int("Whole minutes only.")
    .min(1, "The runtime must be at least a minute.")
    .max(360, "The runtime can be at most 360 minutes."),
  ageRating: z.enum(AGE_RATINGS, { error: "Choose the NFVCB rating." }),
  producerName: z
    .string()
    .trim()
    .min(1, "Name the producer or production company.")
    .max(255, "Keep it under 255 characters."),
  producerRevenueSplit: z.coerce
    .number<string | number>()
    .min(50, "The producer's share is between 50% and 95%.")
    .max(95, "The producer's share is between 50% and 95%."),
  watermarkMode: z.enum(WATERMARK_MODES),
});

export type FilmValues = z.infer<typeof filmSchema>;
/** What the form holds while typing (number fields arrive as text) */
export type FilmFormInput = z.input<typeof filmSchema>;

export const certificateSchema = z.object({
  nfvcbCertNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^NFVCB\/[A-Z0-9/-]+$/, "Use the number as printed, e.g. NFVCB/2026/CAT-A/09841."),
  nfvcbCertUrl: z.url("Link to the certificate's scan or PDF (https://…)."),
});

export type CertificateValues = z.infer<typeof certificateSchema>;

export const POSTER_RULES = {
  types: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
};

/** What's wrong with a poster file before it's sent, or null when it can go */
export function posterProblem(
  file: { type: string; size: number },
  maxBytes = POSTER_RULES.maxBytes,
) {
  if (!POSTER_RULES.types.includes(file.type)) return "Use a JPEG, PNG or WebP image.";
  if (file.size > maxBytes)
    return `Posters can be at most ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  return null;
}
