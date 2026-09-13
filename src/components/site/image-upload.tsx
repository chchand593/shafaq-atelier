"use client";

import * as React from "react";
import { Upload, X, Loader2, Image as ImageIcon, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * ImageUpload — a combined file-upload + URL-paste component for admin product
 * image management. The admin can either:
 *  1. Click "Upload" to pick a file from their computer → uploads to Vercel
 *     Blob via /api/admin/upload → the returned URL is saved automatically.
 *  2. Paste a URL directly into the input field (for images already hosted
 *     somewhere, e.g. /images/products/royal-pleated/teal-1.webp).
 *
 * When a URL is set (either via upload or paste), a thumbnail preview is shown
 * next to the input. The "Remove" button clears the URL.
 *
 * Props:
 *  - url: the current image URL (controlled)
 *  - onChange: called with the new URL (or "" when cleared)
 *  - label: optional label text (e.g. "Front View")
 */
export function ImageUpload({
  url,
  onChange,
  label,
}: {
  url: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum 10MB." });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
      toast.success("Image uploaded", {
        description: data.filename,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: msg });
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Thumbnail preview */}
      <div className="relative size-12 flex-none overflow-hidden rounded-lg border bg-secondary">
        {url ? (
          <img
            src={url}
            alt={label || "Preview"}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Upload button + URL input toggle */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {showUrlInput ? (
          <div className="flex items-center gap-1">
            <Input
              value={url}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste image URL…"
              className="h-8 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowUrlInput(false)}
            >
              <Upload className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setShowUrlInput(true)}
              title="Paste URL instead"
            >
              <Link2 className="size-3.5" />
            </Button>
            {url ? (
              <span className="truncate text-[0.65rem] text-muted-foreground">
                {url.split("/").pop()}
              </span>
            ) : (
              <span className="text-[0.65rem] text-muted-foreground/60">
                No image
              </span>
            )}
          </div>
        )}
      </div>

      {/* Remove button */}
      {url ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 flex-none px-2 text-destructive hover:text-destructive"
          onClick={() => onChange("")}
          aria-label="Remove image"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export default ImageUpload;
