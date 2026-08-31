"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  Clock,
  ArrowRight,
  Send,
  Check,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  User,
  Phone,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Configurable contact details (easy to replace later)
// ---------------------------------------------------------------------------

const WHATSAPP_NUMBER = "+92 300 1234567";
const SUPPORT_EMAIL = "hello@shafaqatelier.pk";
const SUPPORT_HOURS = "Monday – Saturday | 10:00 AM – 6:00 PM";

// ---------------------------------------------------------------------------
// 1. Premium Contact Hero
// ---------------------------------------------------------------------------

function ContactHero() {
  return (
    <section className="bg-secondary py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold)]">Get in Touch</span>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-5xl">
          We&rsquo;d Love to Hear From You
        </h1>
        <div className="gold-rule mx-auto mt-3 max-w-[3.5rem]" />
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Whether you have a question about an abaya, need help with your order,
          or want guidance with your custom design, our team is here to help.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Contact Information Cards
// ---------------------------------------------------------------------------

const INFO_CARDS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Chat with us on WhatsApp",
    action: "Chat on WhatsApp",
    href: `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`,
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    desc: "Send us an email",
    action: "Email Us",
    href: `mailto:${SUPPORT_EMAIL}`,
    external: true,
  },
  {
    icon: Clock,
    title: "Customer Support",
    desc: "We're here to help",
    action: SUPPORT_HOURS,
    href: null as string | null,
    external: false,
  },
];

function ContactInfoCards() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {INFO_CARDS.map((card) => (
            <div
              key={card.title}
              className="card-lift flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
                <card.icon className="size-5" />
              </span>
              <h3 className="font-serif text-lg font-medium">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
              {card.href ? (
                <Button
                  asChild
                  variant="outline"
                  className="mt-2 rounded-full px-5 text-sm hover:border-[var(--gold)] hover:text-[var(--gold)]"
                >
                  <a
                    href={card.href}
                    target={card.external ? "_blank" : undefined}
                    rel={card.external ? "noopener noreferrer" : undefined}
                  >
                    {card.action}
                    <ArrowRight className="ml-1 size-3.5" />
                  </a>
                </Button>
              ) : (
                <p className="mt-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                  {card.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Contact Form
// ---------------------------------------------------------------------------

const SUBJECTS = [
  "General Inquiry",
  "Order Support",
  "Custom Abaya",
  "Size & Fit",
  "Shipping",
  "Returns & Exchange",
  "Other",
] as const;

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Please enter your full name.";
    if (!email.trim()) {
      e.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Please enter a valid email address.";
    }
    if (!subject) e.subject = "Please select a subject.";
    if (!message.trim()) {
      e.message = "Please enter your message.";
    } else if (message.trim().length < 10) {
      e.message = "Your message should be at least 10 characters.";
    }
    return e;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSending(true);
    // Client-side only — simulate a brief delay for UX
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-10 text-center shadow-sm">
        <span className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
          <Check className="size-8" />
        </span>
        <h3 className="font-serif text-2xl font-medium">Thank you for reaching out</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Our team will get back to you soon. We typically respond within 24
          hours during business hours.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setEmail("");
            setPhone("");
            setSubject("");
            setMessage("");
            setErrors({});
          }}
          variant="outline"
          className="rounded-full"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm sm:p-8"
      noValidate
    >
      {/* Full Name + Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Full Name <span className="text-[var(--gold)]">*</span>
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ayesha Khan"
              className="pl-9"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
          </div>
          {errors.name ? (
            <p id="contact-name-error" className="mt-1.5 text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email Address <span className="text-[var(--gold)]">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
            />
          </div>
          {errors.email ? (
            <p id="contact-email-error" className="mt-1.5 text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      {/* Phone (optional) */}
      <div>
        <Label htmlFor="contact-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Phone Number <span className="text-muted-foreground/60">(optional)</span>
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="pl-9"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <Label htmlFor="contact-subject" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Subject <span className="text-[var(--gold)]">*</span>
        </Label>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger
            id="contact-subject"
            className="w-full"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          >
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject ? (
          <p id="contact-subject-error" className="mt-1.5 text-xs text-destructive">
            {errors.subject}
          </p>
        ) : null}
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Message <span className="text-[var(--gold)]">*</span>
        </Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          rows={5}
          maxLength={1000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.message ? (
            <p id="contact-message-error" className="text-xs text-destructive">
              {errors.message}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            {message.length}/1000
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={sending}
        className="h-12 w-full rounded-full text-sm font-medium uppercase tracking-wider sm:w-auto sm:px-8"
      >
        {sending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 4. Custom Abaya Support
// ---------------------------------------------------------------------------

function CustomAbayaSupport() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-secondary/40 p-8 text-center sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
            <Sparkles className="size-6" />
          </span>
          <h2 className="font-serif text-2xl font-medium sm:text-3xl">
            Need Help Designing Your Abaya?
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Our Custom Abaya experience lets you choose your style, fabric,
            colour, sleeves, hijab, embroidery, details and measurements.
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
          >
            <Link href="/customized-abayas">
              Design Your Own Abaya
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Order Support
// ---------------------------------------------------------------------------

function OrderSupport() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
            <ShoppingBag className="size-6" />
          </span>
          <h2 className="font-serif text-2xl font-medium sm:text-3xl">
            Need Help With Your Order?
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            If you have questions about an existing order — tracking, delivery,
            sizing, or returns — visit your account to view your order history,
            or reach out to our support team.
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-7 text-sm font-medium uppercase tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <Link href="/account">
              View Your Account
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. FAQ Preview
// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: "How can I choose the right abaya size?",
    a: "If you're between sizes, we recommend sizing up for a more relaxed, flowing fit. For a perfectly tailored piece, try our Custom Abaya Builder — you can enter your exact measurements for a flawless fit.",
    link: { label: "Design Your Own Abaya", href: "/customized-abayas" },
  },
  {
    q: "How long does delivery take?",
    a: "Orders are dispatched within 1–2 business days and delivered in 3–5 business days across Pakistan. Shipping is free on orders over PKR 10,000.",
    link: null,
  },
  {
    q: "Can I customize an abaya?",
    a: "Yes! Our 14-step Custom Abaya Builder lets you choose style, fabric, colour, sleeves, hijab, embroidery, details and measurements. Crafted in 10–14 days.",
    link: { label: "Design Your Own", href: "/customized-abayas" },
  },
  {
    q: "What is your return/exchange policy?",
    a: "Returns are accepted within 7 days of delivery in original, unworn condition. Please contact our support team to initiate a return.",
    link: null,
  },
  {
    q: "How can I track my order?",
    a: "Once your order is placed, you'll receive an order number. Visit our Order Tracking page and enter your order number to see its status.",
    link: { label: "Track Your Order", href: "/order/LM-XXXXXXXX" },
  },
];

function FAQPreview() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold)]">Quick Answers</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="gold-rule max-w-[3.5rem]" />
        </div>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm font-medium sm:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <p className="leading-relaxed">{faq.a}</p>
                {faq.link ? (
                  <Link
                    href={faq.link.href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--gold)] hover:underline"
                  >
                    {faq.link.label}
                    <ArrowRight className="size-3" />
                  </Link>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Final CTA
// ---------------------------------------------------------------------------

function FinalCTA() {
  return (
    <section className="bg-primary py-20 text-primary-foreground sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold-soft)]">Begin Your Journey</span>
        <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
          Your Perfect Abaya Is Waiting
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
          Explore our daily wear collection or design something entirely your
          own. Your style, your modesty, your abaya.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
          >
            <Link href="/daily-wear">
              <ShoppingBag className="size-4" />
              Shop Daily Wear
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-primary-foreground/40 bg-transparent px-7 text-sm font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            <Link href="/customized-abayas">
              <Sparkles className="size-4" />
              Design Your Own
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Contact page
// ---------------------------------------------------------------------------

export function ContactPage() {
  return (
    <div className="flex flex-col">
      <ContactHero />
      <ContactInfoCards />
      <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="eyebrow text-[var(--gold)]">Send Us a Message</span>
            <h2 className="font-serif text-3xl font-medium sm:text-4xl">
              Contact Form
            </h2>
            <div className="gold-rule max-w-[3.5rem]" />
          </div>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </section>
      <CustomAbayaSupport />
      <OrderSupport />
      <FAQPreview />
      <FinalCTA />
    </div>
  );
}

export default ContactPage;
