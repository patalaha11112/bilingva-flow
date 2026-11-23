/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Old tab URLs
      { source: '/practice', destination: '/essay', permanent: true },
      { source: '/video', destination: '/', permanent: false },
    ]
  },
}

export default nextConfig
