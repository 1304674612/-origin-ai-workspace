import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@origin/ui", "@origin/shared", "@origin/config"],
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
