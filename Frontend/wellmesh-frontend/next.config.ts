import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    dangerouslyAllowSVG: true,
    domains: ["placehold.co", "cdn.pixabay.com"], // ✅ allow domain images
  },
};

export default nextConfig;
