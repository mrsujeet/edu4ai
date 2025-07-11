/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Edu4.AI',
    NEXT_PUBLIC_APP_DESCRIPTION: 'AI-Powered Safe Tutoring Platform',
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;