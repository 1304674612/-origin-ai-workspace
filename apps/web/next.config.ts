import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@origin/ui", "@origin/shared", "@origin/config"],
};

export default nextConfig;
