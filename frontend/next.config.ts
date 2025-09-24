// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // This section defines allowed external image domains for the Next.js Image component.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**", // Explicitly limit to uploads
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**", // Explicitly limit to uploads
      },
      {
        protocol: "http",
        hostname: "lab-tim.org",
      },
      {
        protocol: "http",
        hostname: "lab-tim.org",
      },
      {
        protocol: "http",
        hostname: "102.211.209.201",
      },
      {
        protocol: "http",
        hostname: "172.29.112.1", // Backend IP
        port: "5000",
        pathname: "/uploads/**", // Explicitly limit to uploads
      },
    ],
  },

  // This section defines URL rewrites/proxies.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://172.29.112.1:5000/uploads/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://172.29.112.1:5000/uploads/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
