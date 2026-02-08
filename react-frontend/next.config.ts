import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8082/api/:path*',
      },
      {
        source: '/merchant/:path*',
        destination: 'http://localhost:8082/merchant/:path*',
      },
      {
        source: '/halo/:path*',
        destination: 'http://localhost:8082/halo/:path*',
      },
      {
        source: '/:path*.html',
        destination: 'http://localhost:8082/:path*.html',
      },
      {
        source: '/:path*.css',
        destination: 'http://localhost:8082/:path*.css',
      },
      {
        source: '/:path*.js',
        destination: 'http://localhost:8082/:path*.js',
      },
      {
        source: '/:path*.png',
        destination: 'http://localhost:8082/:path*.png',
      },
      {
        source: '/:path*.svg',
        destination: 'http://localhost:8082/:path*.svg',
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
