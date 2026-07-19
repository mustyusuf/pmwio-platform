import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
