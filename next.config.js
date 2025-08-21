/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기본 설정
  reactStrictMode: false,
  
  // GitHub Pages 배포용 설정
  output: 'export',
  basePath: '/PNT-DASHBOARD',
  assetPrefix: '/PNT-DASHBOARD/',
  
  // 실험적 기능
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
