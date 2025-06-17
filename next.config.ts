import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Node.js built-in 모듈에 대한 fallback 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }

    // node: scheme 처리를 위한 alias 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:crypto': 'crypto',
      'node:fs': 'fs',
      'node:path': 'path',
      'node:os': 'os',
      'node:stream': 'stream',
      'node:buffer': 'buffer',
    };

    return config;
  },
  // 서버 컴포넌트에서 Node.js 모듈 사용 허용 (updated)
  serverExternalPackages: ['node-cron'],
};

export default nextConfig;
