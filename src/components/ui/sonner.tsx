"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      richColors
      closeButton
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--z-index": "120",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans !rounded-lg !border !shadow-lg",
          title: "font-serif text-sm font-semibold",
          description: "text-xs text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
