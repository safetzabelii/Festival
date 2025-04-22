/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Add static file serving from the public directory
  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.(png|jpg|gif|jpeg|webp)$/i,
      type: 'asset/resource'
    });
    return config;
  }
};

export default nextConfig;
