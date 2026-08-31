"use client";

import * as React from "react";
import Link from "next/link";
import { GitCompare, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompare, MAX_COMPARE, useUI } from "@/lib/store";
import { useProductsByIds } from "@/lib/use-products";

export function CompareBar() {
  const { ids, remove, clear } = useCompare();
  const { openQuickView } = useUI();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { products: items } = useProductsByIds(ids);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <span className="flex size-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GitCompare className="size-5" />
        </span>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto elegant-scroll">
          {items.map((p) => (
            <div
              key={p.id}
              className="group relative flex-none"
            >
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute -right-1.5 -top-1.5 z-10 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
                aria-label={`Remove ${p.name}`}
              >
                <X className="size-3" />
              </button>
              <div className="size-12 overflow-hidden rounded-md border bg-secondary">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div
              key={i}
              className="flex size-12 flex-none items-center justify-center rounded-md border border-dashed text-muted-foreground/40"
            >
              +
            </div>
          ))}
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {items.length}/{MAX_COMPARE}
          </span>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/compare">
              Compare <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear comparison"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompareBar;
