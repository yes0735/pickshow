// PickShow OpenAPI 3.0 Specification
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "PickShow API",
    version: "1.0.0",
    description: "공연 예매처 통합 검색 서비스 API",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
    { url: "https://pickshow.vercel.app", description: "Production" },
  ],
  tags: [
    { name: "Performances", description: "공연 검색/상세" },
    { name: "Auth", description: "인증 (회원가입/탈퇴)" },
    { name: "Favorites", description: "찜 등록/해제" },
    { name: "MyPerformances", description: "내가 본 공연" },
    { name: "Community", description: "커뮤니티 게시판/댓글" },
    { name: "CommonCodes", description: "공통코드" },
    { name: "Cron", description: "배치 작업" },
  ],
  paths: {
    "/api/performances": {
      get: {
        tags: ["Performances"],
        summary: "공연 검색",
        description: "키워드 + 7종 필터 + 정렬 + 커서 페이징",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "검색어 (제목, 출연진)" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "장르 코드 (musical, theater, concert, classic, dance, korean, etc)" },
          { name: "status", in: "query", schema: { type: "string", enum: ["upcoming", "ongoing", "completed"] }, description: "공연상태" },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "시작일 (YYYY-MM-DD)" },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "종료일" },
          { name: "minPrice", in: "query", schema: { type: "integer" }, description: "최소 가격" },
          { name: "maxPrice", in: "query", schema: { type: "integer" }, description: "최대 가격" },
          { name: "ageLimit", in: "query", schema: { type: "string" }, description: "관람연령" },
          { name: "ticketSite", in: "query", schema: { type: "string" }, description: "예매처 이름 (놀유니버스, 네이버N예약 등)" },
          { name: "venue", in: "query", schema: { type: "string" }, description: "공연장소" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["date", "price_asc", "price_desc"], default: "date" }, description: "정렬" },
          { name: "cursor", in: "query", schema: { type: "string" }, description: "무한스크롤 커서" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 }, description: "페이지 크기" },
        ],
        responses: {
          "200": {
            description: "검색 결과",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PerformanceListResponse" } } },
          },
        },
      },
    },
    "/api/performances/{id}": {
      get: {
        tags: ["Performances"],
        summary: "공연 상세",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "공연 상세 정보", content: { "application/json": { schema: { $ref: "#/components/schemas/PerformanceDetailResponse" } } } },
          "404": { description: "공연 없음" },
        },
      },
    },
    "/api/common-codes": {
      get: {
        tags: ["CommonCodes"],
        summary: "공통코드 조회",
        parameters: [{ name: "group", in: "query", schema: { type: "string", enum: ["genre", "status", "price_range", "age_limit", "ticket_site", "board_anonymous", "board_member"] }, description: "코드 그룹" }],
        responses: { "200": { description: "코드 목록" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "이메일 회원가입",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nickname", "agreeTerms", "agreePrivacy"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8, description: "영문+숫자 8자 이상" },
                  nickname: { type: "string", minLength: 2, maxLength: 20 },
                  agreeTerms: { type: "boolean", enum: [true] },
                  agreePrivacy: { type: "boolean", enum: [true] },
                  agreeMarketing: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "가입 성공" },
          "400": { description: "유효성 검증 실패" },
          "409": { description: "이미 가입된 이메일" },
        },
      },
    },
    "/api/auth/withdraw": {
      delete: {
        tags: ["Auth"],
        summary: "회원 탈퇴 + 개인정보 파기",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { password: { type: "string", description: "이메일 가입 회원만 필수" } } } } },
        },
        responses: {
          "200": { description: "탈퇴 완료" },
          "401": { description: "미인증" },
        },
      },
    },
    "/api/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "내 찜 목록",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "찜 목록" }, "401": { description: "미인증" } },
      },
      post: {
        tags: ["Favorites"],
        summary: "찜 등록",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["performanceId"], properties: { performanceId: { type: "string", format: "uuid" } } } } },
        },
        responses: { "201": { description: "찜 등록 완료" }, "401": { description: "미인증" }, "409": { description: "이미 찜함" } },
      },
    },
    "/api/favorites/{id}": {
      delete: {
        tags: ["Favorites"],
        summary: "찜 해제",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "찜 해제 완료" }, "401": { description: "미인증" } },
      },
    },
    "/api/my-performances": {
      get: {
        tags: ["MyPerformances"],
        summary: "내가 본 공연 목록",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "목록" }, "401": { description: "미인증" } },
      },
      post: {
        tags: ["MyPerformances"],
        summary: "내가 본 공연 등록",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["performanceId", "rating"],
                properties: {
                  performanceId: { type: "string", format: "uuid" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review: { type: "string", maxLength: 200 },
                  seatInfo: { type: "string", maxLength: 100 },
                  ticketSite: { type: "string" },
                  viewedAt: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "등록 완료" }, "401": { description: "미인증" }, "409": { description: "이미 등록됨" } },
      },
    },
    "/api/my-performances/{id}": {
      put: {
        tags: ["MyPerformances"],
        summary: "내가 본 공연 수정",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review: { type: "string", maxLength: 200 },
                  seatInfo: { type: "string" },
                  ticketSite: { type: "string" },
                  viewedAt: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "수정 완료" }, "401": { description: "미인증" }, "404": { description: "없음" } },
      },
      delete: {
        tags: ["MyPerformances"],
        summary: "내가 본 공연 삭제",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "삭제 완료" }, "401": { description: "미인증" } },
      },
    },
    "/api/community/posts": {
      get: {
        tags: ["Community"],
        summary: "게시글 목록",
        parameters: [
          { name: "boardType", in: "query", required: true, schema: { type: "string", enum: ["anonymous", "member"] } },
          { name: "category", in: "query", schema: { type: "string", enum: ["promotion", "info", "wanted", "transfer"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: { "200": { description: "게시글 목록 + 페이지네이션" } },
      },
      post: {
        tags: ["Community"],
        summary: "게시글 작성",
        description: "회원 게시판은 로그인 필수, 익명 게시판은 닉네임+비밀번호",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["boardType", "category", "title", "content"],
                properties: {
                  boardType: { type: "string", enum: ["anonymous", "member"] },
                  category: { type: "string", enum: ["promotion", "info", "wanted", "transfer"] },
                  title: { type: "string", maxLength: 100 },
                  content: { type: "string", maxLength: 5000 },
                  authorNickname: { type: "string", description: "익명 게시판용" },
                  anonymousPassword: { type: "string", description: "익명 게시판 수정/삭제용" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "작성 완료" }, "401": { description: "회원 게시판 미인증" } },
      },
    },
    "/api/community/posts/{id}": {
      get: {
        tags: ["Community"],
        summary: "게시글 상세 + 댓글",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "게시글 상세" }, "404": { description: "없음" } },
      },
      put: {
        tags: ["Community"],
        summary: "게시글 수정",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "수정 완료" }, "403": { description: "권한 없음" } },
      },
      delete: {
        tags: ["Community"],
        summary: "게시글 삭제",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "삭제 완료" }, "403": { description: "권한 없음" } },
      },
    },
    "/api/community/posts/{id}/comments": {
      post: {
        tags: ["Community"],
        summary: "댓글 작성",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "게시글 ID" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", maxLength: 1000 },
                  authorNickname: { type: "string", description: "비로그인 시" },
                  anonymousPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "댓글 작성 완료" } },
      },
    },
    "/api/community/comments/{id}": {
      delete: {
        tags: ["Community"],
        summary: "댓글 삭제",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "삭제 완료" }, "403": { description: "권한 없음" } },
      },
    },
    "/api/cron/sync-performances": {
      post: {
        tags: ["Cron"],
        summary: "KOPIS 배치 동기화",
        description: "Vercel Cron Job (매일 KST 01:00). CRON_SECRET 필요.",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "동기화 완료" }, "401": { description: "Invalid CRON_SECRET" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Performance: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          kopisId: { type: "string" },
          title: { type: "string" },
          genre: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          venue: { type: "string" },
          venueAddress: { type: "string" },
          status: { type: "string", enum: ["upcoming", "ongoing", "completed"] },
          posterUrl: { type: "string", nullable: true },
          price: { type: "string" },
          minPrice: { type: "integer", nullable: true },
          maxPrice: { type: "integer", nullable: true },
          ageLimit: { type: "string" },
          runtime: { type: "string", nullable: true },
          cast: { type: "string", nullable: true },
          synopsis: { type: "string", nullable: true },
          ticketUrls: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } } } },
        },
      },
      PerformanceListResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Performance" } },
          pagination: {
            type: "object",
            properties: {
              cursor: { type: "string", nullable: true },
              hasNext: { type: "boolean" },
              total: { type: "integer" },
            },
          },
        },
      },
      PerformanceDetailResponse: {
        type: "object",
        properties: { data: { $ref: "#/components/schemas/Performance" } },
      },
      ApiError: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
        },
      },
    },
  },
};
