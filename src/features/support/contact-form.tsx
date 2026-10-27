"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { api, ErrorCode, toApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import { CONTACT_TOPICS, SUPPORT_EMAIL, type ContactTopic } from "./content";

const TOPICS = CONTACT_TOPICS.map((topic) => topic.value) as [ContactTopic, ...ContactTopic[]];

/** Mirrors the API's contact DTO (POST /contact), so most mistakes are caught before sending. */
const contactSchema = z.object({
  topic: z.enum(TOPICS),
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email address").max(254),
  subject: z.string().trim().max(150).optional(),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more (at least 20 characters)")
    .max(5000),
  // Honeypot: hidden from people, filled in by bots; the API drops anything that sets it
  company: z.string().max(0).optional(),
});

type ContactValues = z.infer<typeof contactSchema>;

function topicFromParam(value: string | null): ContactTopic {
  const match = TOPICS.find((topic) => topic.toLowerCase() === value?.toLowerCase());
  return match ?? "SUPPORT";
}

/** Each topic keeps its own accent: blue for help, gold for filmmakers, green for partners. */
const TOPIC_TONES: Record<ContactTopic, { dot: string; selected: string }> = {
  SUPPORT: { dot: "bg-sky-400", selected: "border-sky-400/70 bg-sky-400/8" },
  PRODUCERS: { dot: "bg-gold", selected: "border-gold/70 bg-gold/8" },
  PARTNERSHIPS: { dot: "bg-lobby", selected: "border-lobby/70 bg-lobby/8" },
  PRESS: { dot: "bg-brand", selected: "border-brand bg-brand/8" },
};

const fieldClass =
  "w-full rounded-xl border border-white/12 bg-white/3 px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-brand focus-visible:bg-white/5 aria-invalid:border-destructive";
const labelClass = "text-xs font-semibold tracking-wide text-white/80";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: topicFromParam(searchParams.get("topic")) },
  });
  const topic = useWatch({ control, name: "topic" });

  const onSubmit = async (values: ContactValues) => {
    setFailure(null);
    try {
      await api.post("/contact", { ...values, subject: values.subject || undefined });
      setSentTo(values.email);
      reset({ topic: values.topic });
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.is(ErrorCode.RATE_LIMITED)
          ? "You've sent a few messages in a short time. Please wait a little and try again."
          : apiError.is(ErrorCode.VALIDATION_FAILED)
            ? apiError.messages.join(" ")
            : "We couldn't send your message just now.",
      );
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="py-10 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Check className="size-6" />
        </span>
        <p className="mt-6 font-display text-2xl font-extrabold">Message received</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/70">
          Thank you. We&rsquo;ll reply to <span className="text-foreground">{sentTo}</span>.
        </p>
        <Button variant="glass" className="mt-8" onClick={() => setSentTo(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <fieldset>
        <legend className={labelClass}>What is it about?</legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {CONTACT_TOPICS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand",
                topic === option.value
                  ? TOPIC_TONES[option.value].selected
                  : "border-white/10 hover:border-white/25",
              )}
            >
              <input type="radio" value={option.value} {...register("topic")} className="sr-only" />
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", TOPIC_TONES[option.value].dot)}
                />
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
            className={cn(fieldClass, "mt-2 h-12")}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
            className={cn(fieldClass, "mt-2 h-12")}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          Subject <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="contact-subject"
          {...register("subject")}
          className={cn(fieldClass, "mt-2 h-12")}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          aria-invalid={errors.message ? true : undefined}
          {...register("message")}
          className={cn(fieldClass, "mt-2 resize-y py-3 leading-relaxed")}
        />
        <FieldError message={errors.message?.message} />
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      {failure && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          {failure} You can also email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      )}

      <Button type="submit" size="xl" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Sending…" : "Send message"}
        {!isSubmitting && <ArrowRight data-icon="inline-end" />}
      </Button>
    </form>
  );
}
