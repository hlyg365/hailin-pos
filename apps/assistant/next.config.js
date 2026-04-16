/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hailin/core', '@hailin/order', '@hailin/member'],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
