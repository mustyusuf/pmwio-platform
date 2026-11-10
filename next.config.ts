import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next.js emits inline scripts for hydration, so
// script-src needs 'unsafe-inline' (and 'unsafe-eval' only in dev, for HMR);
// what this still buys is: no framing by other sites, no <object>/plugins, no
// base-tag hijacking, forms that can only post to us (or Paystack), no data
// sent to third-party origins, and embeds limited to the video hosts the
// archive supports.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self' blob: https://www.youtube.com https://player.vimeo.com https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The Qur'an Challenge records audio, so the microphone stays available to us.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // better-sqlite3 is a native module — keep it out of the bundler so it loads
  // directly from node_modules at runtime.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Source maps cost extra memory during the build. The deployment server is
  // memory-constrained, so leave them off in production.
  productionBrowserSourceMaps: false,
  experimental: {
    // Albums can contain several images. Validation in the action keeps each
    // file at 10MB, the album at 20 files, and the combined payload at 80MB.
    serverActions: { bodySizeLimit: "100mb" },
    serverSourceMaps: false,
  },
};

export default nextConfig;
