import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it out of the bundler so it loads
  // directly from node_modules at runtime.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  experimental: {
    // Albums can contain several images. Validation in the action keeps each
    // file at 10MB, the album at 20 files, and the combined payload at 90MB.
    serverActions: { bodySizeLimit: "100mb" },
  },
};

export default nextConfig;
