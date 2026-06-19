import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',            // 메인 페이지 등 일반 접근은 허용
      disallow: [
        '/api/',            // 백엔드 API 주소 차단
        '/dashboard/',      // 가계부 대시보드 내부 화면 차단 (예시)
        '/auth/',           // 로그인/인증 관련 페이지 차단
      ],
    },
    sitemap: 'https://jellian.com/sitemap.xml', // 내 사이트맵 주소 연결
  }
}