"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUI } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/site-data";

const POPULAR = ["Black abaya", "Everyday", "Gold trim", "Bespoke", "Bell sleeve"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Debounced server-side search
  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { products: Product[] };
        setResults(data.products);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    if (!searchOpen) {
      const t = setTimeout(() => {
        setQuery("");
        setResults([]);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const closeAndGo = () => setSearchOpen(false);

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        className="top-[8%] max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-xl border bg-background p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search the store</DialogTitle>
        <DialogDescription className="sr-only">
          Search for abayas by name, colour, fabric or collection
        </DialogDescription>

        {/* Search input row */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search abayas, colours, fabrics…"
            aria-label="Search query"
            className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto elegant-scroll p-4">
          {query.trim() === "" ? (
            <div>
              <p className="eyebrow text-[var(--mocha)]">Popular searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : !loading && results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-serif text-lg">No results for “{query}”</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword, or browse our collections below.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="eyebrow text-[var(--mocha)]">
                {loading ? "Searching…" : `${results.length} result${results.length > 1 ? "s" : ""}`}
              </p>
              <ul className="mt-3 divide-y">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.id}`}
                      onClick={closeAndGo}
                      className="group flex w-full items-center gap-4 py-3 text-left"
                    >
                      <div className="size-14 flex-none overflow-hidden rounded-md bg-secondary">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-sm font-medium">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.category} · {p.colorOptions.map((c) => c.name).join(", ")}
                        </p>
                      </div>
                      <span className="font-serif text-sm font-semibold">
                        {formatPKR(p.price)}
                      </span>
                      <ArrowRight
                        className={cn(
                          "size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]"
                        )}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchOverlay;
