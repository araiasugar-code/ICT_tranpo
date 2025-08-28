import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintを無視する（Vercelデプロイ用）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptエラーを無視する（Vercelデプロイ用）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
