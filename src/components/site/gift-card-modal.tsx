"use client";

import * as React from "react";
import { Gift, Loader2, Check, Mail, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

const AMOUNTS = [5000, 10000, 15000, 25000, 50000];

type CreatedCard = {
  code: string;
  amount: number;
  balance: number;
  recipientName: string;
  recipientEmail: string;
  message: string | null;
};

export function GiftCardModal() {
  const { giftCardOpen, setGiftCardOpen } = useUI();
  const [amount, setAmount] = React.useState<number>(10000);
  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<CreatedCard | null>(null);

  React.useEffect(() => {
    if (!giftCardOpen) {
      const t = setTimeout(() => {
        setCreated(null);
        setLoading(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [giftCardOpen]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error("Recipient name and email are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error("Please enter a valid recipient email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          buyerName: buyerName.trim() || undefined,
          buyerEmail: buyerEmail.trim() || undefined,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        giftCard?: CreatedCard;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.giftCard) {
        throw new Error(data.error || "Failed to create gift card");
      }
      setCreated(data.giftCard);
      toast.success("Gift card created", {
        description: `Code: ${data.giftCard.code}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create gift card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={giftCardOpen} onOpenChange={setGiftCardOpen}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0">
        <DialogTitle className="sr-only">
          {created ? "Gift card created" : "Purchase a gift card"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {created
            ? "Your gift card code is ready to share"
            : "Gift a ShafaQ Atelier gift card to someone special"}
        </DialogDescription>

        {created ? (
          <CreatedView card={created} onClose={() => setGiftCardOpen(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-6 py-4">
              <Gift className="size-5 text-[var(--gold)]" />
              <h2 className="font-serif text-lg font-medium">Gift Card</h2>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex-1 space-y-4 overflow-y-auto elegant-scroll px-6 py-5"
            >
              {/* Amount selection */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Choose an amount
                </span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-medium transition-all",
                        amount === a
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-foreground/40"
                      )}
                    >
                      {a >= 1000 ? `${a / 1000}k` : a}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{formatPKR(amount)}</span>
                </p>
              </div>

              {/* Buyer (optional) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Your name (optional)
                  </span>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="From…"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Your email (optional)
                  </span>
                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              {/* Recipient */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Recipient name <span className="text-[var(--gold)]">*</span>
                  </span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ayesha"
                      className="pl-9"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Recipient email <span className="text-[var(--gold)]">*</span>
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="ayesha@example.com"
                      className="pl-9"
                    />
                  </div>
                </label>
              </div>

              {/* Message */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Personal message (optional)
                </span>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Wishing you elegance and grace…"
                  rows={2}
                  maxLength={200}
                />
              </label>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
              <span className="font-serif text-lg font-semibold">
                {formatPKR(amount)}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setGiftCardOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={loading}
                  className="rounded-full px-6"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="size-4" /> Purchase
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedView({
  card,
  onClose,
}: {
  card: CreatedCard;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
        <Check className="size-8" />
      </span>
      <h2 className="mt-4 font-serif text-2xl font-medium">Gift Card Ready</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatPKR(card.amount)} for {card.recipientName}
      </p>

      {/* Gift card visual */}
      <div className="mt-6 w-full max-w-sm overflow-hidden rounded-xl border bg-gradient-to-br from-primary to-[var(--mocha)] p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-semibold tracking-wide">
            SHAFAQ <span className="text-[var(--gold-soft)]">ATELIER</span>
          </span>
          <Gift className="size-5 text-[var(--gold-soft)]" />
        </div>
        <p className="mt-6 font-serif text-3xl font-semibold">
          {formatPKR(card.amount)}
        </p>
        <p className="mt-1 text-xs text-primary-foreground/70">Gift Card</p>
        <div className="mt-4 border-t border-primary-foreground/20 pt-3">
          <p className="text-[0.65rem] uppercase tracking-wider text-primary-foreground/60">
            Code
          </p>
          <p className="font-mono text-sm font-medium tracking-wider">
            {card.code}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:border-foreground/40"
      >
        <span className="text-muted-foreground">Copy code</span>
        <span className="font-mono font-medium">{card.code}</span>
        {copied ? (
          <Check className="size-3.5 text-[var(--gold)]" />
        ) : null}
      </button>

      {card.message ? (
        <p className="mt-4 max-w-xs text-sm italic text-muted-foreground">
          “{card.message}”
        </p>
      ) : null}

      <Button onClick={onClose} className="mt-6 rounded-full px-8">
        Done
      </Button>
    </div>
  );
}

export default GiftCardModal;
