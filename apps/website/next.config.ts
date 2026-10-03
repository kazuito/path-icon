import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/try", destination: "/playground", permanent: true }];
  },
};

export default nextConfig;
