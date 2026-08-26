import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/iclock/cdata',
        destination: '/api/iclock/cdata',
      },
      {
        source: '/iclock/getrequest',
        destination: '/api/iclock/getrequest',
      },
      {
        source: '/iclock/devicecmd',
        destination: '/api/iclock/devicecmd',
      },
      {
        source: '/iclock/cdata.aspx',
        destination: '/api/iclock/cdata',
      },
      {
        source: '/iclock/getrequest.aspx',
        destination: '/api/iclock/getrequest',
      },
      {
        source: '/iclock/devicecmd.aspx',
        destination: '/api/iclock/devicecmd',
      },
      {
        source: '/iclock/:path*',
        destination: '/api/iclock/:path*',
      },
    ];
  },
};

export default nextConfig;
