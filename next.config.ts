import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
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
