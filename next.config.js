/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jszip'],
  },
};

module.exports = nextConfig;
