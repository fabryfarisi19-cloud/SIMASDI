import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
  "node-edge-tts",
  "ws",
  "bufferutil",
],

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