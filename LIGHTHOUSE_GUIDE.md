# Lighthouse 검수 가이드

## Lighthouse란?
Google에서 제공하는 웹 페이지 품질 측정 도구로, 성능(Performance), 접근성(Accessibility), SEO, 모범 사례(Best Practices) 4개 영역을 점수로 평가합니다.

---

## 실행 방법

### 방법 1: Chrome DevTools (권장)
1. Chrome에서 `https://pickshow.vercel.app` 접속
2. `F12` 또는 `Cmd + Option + I`로 개발자 도구 열기
3. 상단 탭에서 **Lighthouse** 선택
4. 설정:
   - Mode: **Navigation**
   - Device: **Mobile** (모바일 우선 테스트 권장)
   - Categories: 전체 체크 (Performance, Accessibility, Best Practices, SEO)
5. **Analyze page load** 클릭
6. 약 30초~1분 후 결과 확인

### 방법 2: PageSpeed Insights (온라인)
1. https://pagespeed.web.dev 접속
2. URL 입력: `https://pickshow.vercel.app`
3. **분석** 클릭
4. Mobile / Desktop 탭 전환하며 확인

### 방법 3: CLI
```bash
npm install -g lighthouse
lighthouse https://pickshow.vercel.app --view
```

---

## 점수 기준

| 점수 | 등급 |
|------|------|
| 90~100 | 우수 (녹색) |
| 50~89 | 개선 필요 (주황) |
| 0~49 | 미흡 (빨강) |

---

## 4개 영역별 체크포인트

### 1. Performance (성능)
주요 측정 항목:
- **FCP (First Contentful Paint)**: 첫 콘텐츠가 화면에 표시되는 시간
- **LCP (Largest Contentful Paint)**: 가장 큰 콘텐츠가 표시되는 시간 (2.5초 이내 권장)
- **TBT (Total Blocking Time)**: 메인 스레드 차단 시간
- **CLS (Cumulative Layout Shift)**: 레이아웃 밀림 정도 (0.1 이하 권장)
- **Speed Index**: 페이지 콘텐츠가 채워지는 속도

개선 포인트:
- 이미지 최적화 (WebP 변환, lazy loading)
- JS/CSS 번들 크기 축소
- 웹폰트 로딩 최적화 (preload, font-display: swap)
- 불필요한 JS 제거

### 2. Accessibility (접근성)
주요 체크 항목:
- 이미지에 `alt` 속성 존재 여부
- 버튼/링크에 접근 가능한 텍스트 존재 여부
- 색상 대비율 (텍스트와 배경 간 4.5:1 이상)
- 폼 요소에 `label` 연결 여부
- 페이지 언어 속성 (`<html lang="ko">`)
- 제목(heading) 순서가 올바른지

### 3. Best Practices (모범 사례)
주요 체크 항목:
- HTTPS 사용 여부
- 콘솔 에러 없음
- 안전하지 않은 외부 링크에 `rel="noopener"` 사용
- 이미지 해상도 적절성
- 사용되지 않는 JS/CSS 없음

### 4. SEO
주요 체크 항목:
- `<title>` 태그 존재
- `<meta name="description">` 존재
- `robots.txt` 접근 가능
- `<meta name="viewport">` 설정
- 링크에 설명 텍스트 존재 (a 태그 내 텍스트)
- 페이지가 크롤링 차단되지 않음

---

## 테스트 시 주의사항

1. **시크릿 모드에서 실행** — 브라우저 확장 프로그램이 결과에 영향을 줄 수 있음
2. **모바일 먼저 테스트** — Google은 모바일 기준으로 색인
3. **여러 번 실행** — 네트워크 상태에 따라 점수가 변동될 수 있으므로 3회 평균 권장
4. **프로덕션 URL로 테스트** — localhost가 아닌 실제 배포 URL 사용

---

## 결과 저장
- Chrome DevTools: 결과 화면 상단 **Export** 버튼 → JSON/HTML 저장
- PageSpeed Insights: 화면 캡처 또는 URL 공유
- CLI: `lighthouse URL --output html --output-path ./report.html`
