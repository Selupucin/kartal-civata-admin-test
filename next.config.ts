import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
  serverExternalPackages: ['mongoose'],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
