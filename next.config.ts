import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nwospdurijlnwsrmdpaf.supabase.co",
      },
    ],
  },
};

export default nextConfig;