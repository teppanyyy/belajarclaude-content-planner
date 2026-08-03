/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Reference images are sent to server actions as base64, which is
      // larger than the default 1MB limit — bump it so uploads go through.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
