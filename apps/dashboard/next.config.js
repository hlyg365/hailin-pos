/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hailin/core', '@hailin/order', '@hailin/member', '@hailin/promotion', '@hailin/payment'],
  experimental: {
    serverComponentsExternalPackages: ['@hailin/*'],
  },
};

module.exports = nextConfig;
