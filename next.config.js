/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Enable for static export build
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
