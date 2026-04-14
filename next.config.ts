import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Needed so server-side SQLite works correctly in Next.js App Router
  },
  // Tell webpack not to bundle native modules (better-sqlite3)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

export default nextConfig;