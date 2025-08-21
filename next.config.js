/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기본 설정
  reactStrictMode: false,
  
  // 이미지 최적화 설정
  images: {
    unoptimized: false,
  },
  
  // 실험적 기능 비활성화
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
