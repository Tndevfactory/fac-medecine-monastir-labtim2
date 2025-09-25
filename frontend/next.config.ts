/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
        // Your public domain (served by Nginx, proxying to backend:5000/uploads)
        protocol: "https",
        hostname: "lab-tim.org",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "lab-tim.org",
        pathname: "/uploads/**",
      },
    ],
  },

  async rewrites() {
    return [
      // Proxy /uploads → backend
      {
        source: "/uploads/:path*",
        destination: "http://backend:5000/uploads/:path*", // backend is your docker service name
      },
      // Proxy /api → backend
      {
        source: "/api/:path*",
        destination: "http://backend:5000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
