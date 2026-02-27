/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["mongoose"],
  },
};

export default nextConfig;
