# Archive Index — 2026-04

보관된 완료 feature 목록입니다. PDCA 사이클을 완료하고 프로덕션 배포까지 검증된 feature만 여기에 있습니다.

---

## Features

### [seo-boost](./seo-boost/) — 2026-04-12

> PickShow SEO 전면 개선 — 홈 RSC 전환, 531개 롱테일 랜딩 페이지, 6종 JSON-LD 빌더, next/font/next/image, 측정 인프라

| 항목 | 값 |
|---|---|
| **PDCA Duration** | 1 session (Plan → Design → Do → Check → Act-1 → Report → Archive) |
| **Match Rate** | ~95.8% (Act-1 이후) |
| **Files Changed** | 27 (10 new + 14 modified + 3 docs) |
| **Build Output** | 26 → 492 static pages (+466) |
| **Longtail Landings** | 0 → 531 (7 genre + 524 venue) |
| **JSON-LD Types** | 1 (partial Event) → 6 (Event/WebSite/Breadcrumb/ItemList/Place/Organization) |
| **Business Goal** | 공연 롱테일 검색 유입 극대화 |
| **Deployment Status** | ✅ Production verified on `https://pickshow.vercel.app` |
| **External Work Remaining** | 커스텀 도메인 연결, GSC 등록, Rich Results Test, GA4 연동 (체크리스트는 report 문서 참조) |

**Commits** (main branch):
- `a3b94ff` feat(seo): boost SEO with SSR + landing pages + JSON-LD
- `3f61621` fix(seo): resolve runtime sitemap and venue URL encoding issues
- `3730b4d` perf(seo): cache sitemap for 24h to avoid DB query on every bot request

**Documents**:
- [seo-boost.plan.md](./seo-boost/seo-boost.plan.md) — 16 FR, 7 Risks, In Scope 13
- [seo-boost.design.md](./seo-boost/seo-boost.design.md) — Option C Pragmatic Balance, 11 sections
- [seo-boost.analysis.md](./seo-boost/seo-boost.analysis.md) — gap-detector report (93.8% static → 95.8% post-Act-1)
- [seo-boost.report.md](./seo-boost/seo-boost.report.md) — Executive Summary, Value Delivered, Decision Record, Recommendations
