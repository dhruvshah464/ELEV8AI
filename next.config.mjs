/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  // Allow builds to complete even with lint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow gradual TypeScript adoption
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
