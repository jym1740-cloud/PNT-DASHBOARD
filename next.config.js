/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기본 설정
  reactStrictMode: false,
  
  // 실험적 기능
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
