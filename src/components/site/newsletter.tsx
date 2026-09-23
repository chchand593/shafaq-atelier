"use client";

import * as React from "react";
import { Mail, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done">(
    "idle"
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email", {
        description: "So we can send your welcome offer.",
      });
      return;
    }
    setStatus("loading");
    // Frontend-only simulation; no backend wiring in this phase.
    setTimeout(() => {
      setStatus("done");
      toast.success("Welcome to ShafaQ Atelier", {
        description: "Check your inbox for 10% off your first abaya.",
      });
      setEmail("");
    }, 700);
  };

  return (
    <section id="newsletter" className="bg-secondary/60 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold)]">Join The Circle</span>
        <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
          Get 10% Off Your First Abaya
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Subscribe for early access to new arrivals, private sales and
          styling notes from our atelier — plus a little welcome gift just for
          you.
        </p>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-12 rounded-full border-border bg-background pl-10 pr-4 shadow-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "loading"}
            className="h-12 rounded-full px-7 text-sm font-medium uppercase tracking-wider"
          >
            {status === "done" ? (
              <>
                <Check className="size-4" /> Subscribed
              </>
            ) : status === "loading" ? (
              "Sending…"
            ) : (
              <>
                Subscribe
                <ArrowRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          By subscribing you agree to receive marketing emails. Unsubscribe
          anytime. We respect your privacy.
        </p>
      </div>
    </section>
  );
}

export default Newsletter;
