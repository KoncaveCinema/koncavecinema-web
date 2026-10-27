"use client";

import { Clock, HelpCircle, Mail, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CrimsonHalo, FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_CHANNELS } from "@/lib/data";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [channel, setChannel] = useState("support");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      {/* Background Atmosphere - ScreenGlow with showLine=false so no white line appears at top */}
      <div className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
        <ScreenGlow showLine={false} />
        <CrimsonHalo className="-top-32 left-1/2 -translate-x-1/2 opacity-30" />
        <FilmGrain />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36 lg:pb-24">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand backdrop-blur-md">
            <Sparkles className="size-3.5" />
            Koncave Concierge &amp; Inquiries
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            We&rsquo;re Here for the Premiere
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Whether you&rsquo;re an independent filmmaker launching your next theatrical feature, an
            audience member needing ticketing assistance, or a partner exploring collaboration, our
            team is ready.
          </p>
        </div>

        {/* 4 Dedicated Channels Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <Card
                key={ch.title}
                className="group relative flex flex-col justify-between border-white/8 bg-surface-1/60 p-6 backdrop-blur-md transition-all hover:border-brand/40 hover:bg-surface-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <Icon className="size-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-white/10 text-[11px] text-muted-foreground"
                    >
                      {ch.badge}
                    </Badge>
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-foreground">{ch.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {ch.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/8 pt-4">
                  <a
                    href={`mailto:${ch.email}`}
                    className="hover:text-brand-light inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors"
                  >
                    <Mail className="size-3.5" />
                    {ch.email}
                  </a>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Two-Column Form & Fast Support Grid */}
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          {/* Direct Message Form */}
          <div className="lg:col-span-7">
            <Card className="border-white/10 bg-surface-1/80 p-6 backdrop-blur-md sm:p-8">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl font-bold">Send Direct Dispatch</CardTitle>
                <CardDescription>
                  Your message routes immediately to our concierge support desk.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {submitted ? (
                  <div className="rounded-xl border border-brand/40 bg-brand/10 p-8 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand text-white">
                      <Sparkles className="size-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">Message Dispatched</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thank you for contacting Koncave Cinema. A concierge specialist will respond
                      to{" "}
                      <strong className="text-foreground">{formData.email || "your email"}</strong>{" "}
                      promptly.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", subject: "", message: "" });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="contact-name"
                          className="text-xs font-semibold text-foreground"
                        >
                          Full Name
                        </label>
                        <Input
                          id="contact-name"
                          required
                          placeholder="E.g., Tunde Adeleke"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-10 border-white/12 bg-surface-2/60 text-sm focus-visible:ring-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="contact-email"
                          className="text-xs font-semibold text-foreground"
                        >
                          Email Address
                        </label>
                        <Input
                          id="contact-email"
                          type="email"
                          required
                          placeholder="tunde@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-10 border-white/12 bg-surface-2/60 text-sm focus-visible:ring-brand"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">
                        Inquiry Category
                      </label>
                      <Select value={channel} onValueChange={setChannel}>
                        <SelectTrigger className="h-10 border-white/12 bg-surface-2/80 text-sm text-foreground focus-visible:ring-brand">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filmmaker">
                            Filmmaker / Distribution Inquiries
                          </SelectItem>
                          <SelectItem value="support">
                            Audience Ticketing &amp; Showtimes
                          </SelectItem>
                          <SelectItem value="suites">Private VIP Suite Bookings</SelectItem>
                          <SelectItem value="legal">Privacy &amp; Policy Inquiries</SelectItem>
                          <SelectItem value="press">
                            Press &amp; Institutional Partnerships
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="contact-subject"
                        className="text-xs font-semibold text-foreground"
                      >
                        Subject Line
                      </label>
                      <Input
                        id="contact-subject"
                        required
                        placeholder="E.g., Premiere Distribution for Q4 Feature"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="h-10 border-white/12 bg-surface-2/60 text-sm focus-visible:ring-brand"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="contact-message"
                        className="text-xs font-semibold text-foreground"
                      >
                        Message Details
                      </label>
                      <Textarea
                        id="contact-message"
                        required
                        rows={5}
                        placeholder="Provide details regarding your screening, film title, technical inquiry, or booking request..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="border-white/12 bg-surface-2/60 text-sm focus-visible:ring-brand"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="hover:bg-brand-light w-full gap-2 bg-brand text-white"
                    >
                      <Send className="size-4" />
                      Dispatch Message to Concierge
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rapid Concierge & Physical HQ Box */}
          <div className="space-y-6 lg:col-span-5">
            {/* Live WhatsApp / Rapid Concierge */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Live WhatsApp Concierge</h3>
                  <p className="text-xs text-emerald-400/80">
                    Available during scheduled premiere windows
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Need instant assistance with room audio, LiveKit WebRTC permissions, or Chowdeck
                delivery updates? Our theatre ops team monitors active screenings in real time.
              </p>
              <a
                href="https://wa.me/2348000000000?text=Hello%20Koncave%20Cinema%20Support"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                <MessageCircle className="size-3.5" />
                Open WhatsApp Concierge
              </a>
            </div>

            {/* Help Center Shortcut */}
            <div className="rounded-2xl border border-white/10 bg-surface-1/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Frequently Asked Questions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Instant answers for showtimes &amp; playback
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Explore guides on our 4-Zone Catch-Up Engine, single-device DRM concurrency rules,
                and ticket passes.
              </p>
              <Link
                href="/help"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                Browse Help Center &amp; Guides →
              </Link>
            </div>

            {/* Operating Hours Box */}
            <div className="rounded-2xl border border-white/10 bg-surface-1/60 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-foreground">
                Operations &amp; Support Coverage
              </h3>
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <Clock className="size-4.5 shrink-0 text-brand" />
                  <div>
                    <strong className="text-foreground">Support Hours:</strong> Monday – Sunday,
                    08:00 - 00:00 WAT. Auditorium monitoring active during all scheduled screenings.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4.5 shrink-0 text-brand" />
                  <div>
                    <strong className="text-foreground">Official Channel:</strong>{" "}
                    info@koncavecinema.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
