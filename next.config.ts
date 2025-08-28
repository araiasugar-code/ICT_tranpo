import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercelデプロイ用最適化設定
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 実験的機能を無効化（安定性向上）
  experimental: {
    turbo: undefined,
  },
  // 出力設定（削除）
  // output: 'standalone',
  // 画像最適化
  images: {
    domains: ['kdexhywdbpxwhoawabhx.supabase.co'],
  },
};

export default nextConfig;
