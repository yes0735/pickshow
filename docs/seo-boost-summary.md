# SEO 보강 개선사항 요약

> **Feature**: seo-boost
> **Date**: 2026-04-12
> **Status**: ✅ Production 배포 완료
> **전체 문서**: [docs/archive/2026-04/seo-boost/](./archive/2026-04/seo-boost/)

---

## 🎯 핵심 3가지

1. **홈이 검색엔진에 보임** — 전체 CSR이었던 홈을 Server Component로 전환. 크롤러가 초기 HTML에서 공연 카드 20개를 즉시 읽을 수 있게 됨.

2. **531개 롱테일 랜딩 페이지 신규 생성**
   - `/genre/[slug]` — 7개 장르 (뮤지컬, 연극, 콘서트, 클래식, 무용, 국악, 기타)
   - `/venue/[slug]` — **524개 공연장**을 한글 SEO URL로 생성 (예: `/venue/영화의전당`)

3. **Rich Results 자격 확보** — Google SERP에 공연 카드, 브레드크럼, 공연장 정보가 풍부하게 표시됨

---

## 📦 구체적 개선 항목

| 영역 | Before | After |
|---|---|---|
| **홈 렌더링** | CSR (빈 HTML) | RSC + Client island (20 카드 SSR) |
| **공연 포스터** | `<img>` | `next/image` (AVIF/WebP) |
| **Pretendard 폰트** | CDN (render-blocking) | self-hosted `next/font/local` |
| **Metadata** | 기본만 | `metadataBase`, `canonical`, `twitter card`, `keywords` |
| **JSON-LD** | Event (일부 필드) | **6종** (Event/WebSite/Breadcrumb/ItemList/Place/Organization) |
| **Event JSON-LD** | 기본 필드 | `eventStatus`, `eventAttendanceMode`, `organizer`, `PostalAddress`, `priceCurrency: KRW` |
| **공연 상세 캐싱** | 매 요청 DB | 1h ISR |
| **Sitemap** | 1000개 제한 | **10,180개** (24h 캐싱, Vercel Edge HIT) |
| **Sitemap 구성** | 공연만 | 5 정적 + 7 장르 + 524 공연장 + 9,644 공연 |
| **robots.txt** | 기본 disallow | `/api-docs`, `/og/` 추가 |
| **측정 인프라** | 없음 | GA4 consent-gated (code-ready), GSC verification meta |

---

## 🐛 런타임 검증 중 발견·수정한 2개 버그

1. **`generateSitemaps()` 빈 urlset** — Next.js 16이 `id`를 string으로 전달하여 `id === 0` 비교 실패. 단일 sitemap으로 전환.
2. **한글 venue URL 404** — `params.slug`이 URL-encoded 상태로 전달. `decodeURIComponent + NFC` 처리 추가.

---

## 🏆 효과 (예상)

| 지표 | 개선 |
|---|---|
| 정적 페이지 | 26 → **492** (+466) |
| 롱테일 키워드 타겟 | 0 → **531개** |
| 홈 LCP | CSR 대기 시간 제거 |
| Rich Results 자격 | ❌ → ✅ (Event, Breadcrumb, ItemList, Place) |
| 색인 커버리지 | sitemap URL 10배 (1K→10K) |

---

## ✅ 배포 상태

- **Production**: `https://pickshow.vercel.app` (17/17 검증 통과)
- **커밋**: 4개 (feat + fix × 2 + chore-archive)
- **Match Rate**: 95.8%

### Commits
```
a228ba8 chore(pdca): archive seo-boost feature
3730b4d perf(seo): cache sitemap for 24h to avoid DB query on every bot request
3f61621 fix(seo): resolve runtime sitemap and venue URL encoding issues
a3b94ff feat(seo): boost SEO with SSR + landing pages + JSON-LD
```

---

## 📝 남은 외부 작업 (도메인 연결 후)

1. `pickshow.kr` 도메인 연결 + `NEXT_PUBLIC_SITE_URL` 업데이트
2. Google Search Console 등록 + sitemap 제출
3. Rich Results Test 수동 검증
4. GA4 Measurement ID 설정
5. 4주 후 성과 측정 (GSC Impressions 3배, 색인 공연 80% 목표)

---

## 📚 관련 문서

- [전체 Plan](./archive/2026-04/seo-boost/seo-boost.plan.md)
- [전체 Design](./archive/2026-04/seo-boost/seo-boost.design.md)
- [Gap Analysis](./archive/2026-04/seo-boost/seo-boost.analysis.md)
- [Completion Report](./archive/2026-04/seo-boost/seo-boost.report.md)
