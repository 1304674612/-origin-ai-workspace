import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@origin/ui", "@origin/shared", "@origin/config"],
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*"],
    "/blog/*": ["./content/blog/**/*"],
    "/dashboard": ["./content/blog/**/*"],
  },
  async rewrites() {
    const apiUrl = process.env.ORIGIN_API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
