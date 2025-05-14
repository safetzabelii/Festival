/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['localhost', 'your-backend-domain.onrender.com'], // Add your backend domain
  },
  // Add static file serving from the public directory
  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.(png|jpg|gif|jpeg|webp)$/i,
      type: 'asset/resource'
    });
    return config;
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
};

export default nextConfig;
