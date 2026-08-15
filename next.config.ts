import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow curriculum.json to be imported as a module
  experimental: {
    // typedRoutes: true,  // Enable if needed later
  },
};

export default nextConfig;
