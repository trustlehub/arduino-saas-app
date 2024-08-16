/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, child_process: false };
    return config;
  },
};

export default nextConfig;
