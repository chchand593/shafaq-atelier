"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, UserCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/store";
import { toast } from "sonner";

type Mode = "login" | "signup";

export function AuthModal() {
  const { authOpen, setAuthOpen } = useUI();
  const [mode, setMode] = React.useState<Mode>("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // reset form when closed
  React.useEffect(() => {
    if (!authOpen) {
      const t = setTimeout(() => {
        setName("");
        setEmail("");
        setPassword("");
        setLoading(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [authOpen]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setLoading(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          toast.error(data.error || "Could not create account");
          setLoading(false);
          return;
        }
        toast.success("Account created", {
          description: "Welcome to ShafaQ Atelier.",
        });
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }
      toast.success(mode === "signup" ? "Welcome" : "Welcome back");
      setAuthOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="max-w-md overflow-hidden rounded-xl border bg-background p-0">
        <DialogTitle className="sr-only">
          {mode === "login" ? "Sign in" : "Create account"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === "login"
            ? "Sign in to your ShafaQ Atelier account"
            : "Create a new ShafaQ Atelier account"}
        </DialogDescription>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 px-6 pb-4 pt-7 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
            <UserCircle2 className="size-6" />
          </span>
          <h2 className="font-serif text-2xl font-medium">
            {mode === "login" ? "Welcome Back" : "Join ShafaQ Atelier"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to access your orders and wishlist."
              : "Create an account for a faster, richer shopping experience."}
          </p>
        </div>

        {/* Tabs */}
        <div className="mx-6 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-full py-1.5 text-xs font-medium uppercase tracking-wider transition-all",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3 px-6 py-5">
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Full name
              </span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ayesha Khan"
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
                autoComplete="email"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            {mode === "signup" ? (
              <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                At least 6 characters
              </span>
            ) : null}
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full text-sm font-medium uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {mode === "login" ? "New to ShafaQ Atelier? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
