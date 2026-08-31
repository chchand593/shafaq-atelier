import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow the Z.ai Preview iframe origin to load /_next/* dev resources and
  // the Turbopack HMR WebSocket. Dev-only — no effect on production builds.
  allowedDevOrigins: [
    "*.space-z.ai",
    // The Z.ai Preview iframe sometimes reaches the dev server via the Caddy
    // gateway (port 81), whose forwarded Origin resolves to 127.0.0.1 or
    // localhost. Without these entries, Next.js 16's dev server blocks
    // /_next/* chunk requests with "Blocked cross-origin request from
    // 127.0.0.1 to /_next/* resource", which makes the Preview iframe render
    // blank. Dev-only — no effect on production builds.
    "127.0.0.1",
    "localhost",
  ],
  // Enforce TypeScript checks during production builds.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Security headers — environment-aware.
  // In development/preview: allow iframe embedding (needed for Z.ai Preview panel).
  // In production: deny iframe embedding (clickjacking protection).
  async headers() {
    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // Only add X-Frame-Options: DENY in production.
    // In development, omit it so the Z.ai Preview iframe can embed the page.
    if (isProduction) {
      baseHeaders.push({ key: "X-Frame-Options", value: "DENY" });
    }

    return [
      {
        source: "/:path*",
        headers: baseHeaders,
      },
      {
        // Admin routes get extra-hardened headers (only in production).
        source: "/admin/:path*",
        headers: isProduction
          ? [
              { key: "X-Frame-Options", value: "DENY" },
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "Referrer-Policy", value: "no-referrer" },
            ]
          : [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "Referrer-Policy", value: "no-referrer" },
            ],
      },
    ];
  },
};

export default nextConfig;
