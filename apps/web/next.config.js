/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  transpilePackages: ['@servesa/case-contract'],
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
}

module.exports = nextConfig
