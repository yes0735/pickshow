// Design Ref: §2.1 — KOPIS API 클라이언트 (XML→JSON 변환)

const KOPIS_BASE_URL = "http://www.kopis.or.kr/openApi/restful";

function getApiKey(): string {
  const key = process.env.KOPIS_API_KEY;
  if (!key) throw new Error("KOPIS_API_KEY가 설정되지 않았습니다.");
  return key;
}

interface KopisPerformance {
  mt20id: string; // 공연 ID
  prfnm: string; // 공연명
  prfpdfrom: string; // 시작일
  prfpdto: string; // 종료일
  fcltynm: string; // 공연장소
  genrenm: string; // 장르
  prfstate: string; // 공연상태
  poster: string; // 포스터 URL
  openrun: string; // 오픈런 여부
}

interface KopisDetail {
  mt20id: string;
  prfnm: string;
  prfpdfrom: string;
  prfpdto: string;
  fcltynm: string;
  genrenm: string;
  prfstate: string;
  poster: string;
  prfcast: string; // 출연진
  prfruntime: string; // 런타임
  pcseguidance: string; // 가격
  dtguidance: string; // 공연시간
  sty: string; // 줄거리
  relates: { relate: { relatenm: string; relateurl: string }[] }; // 예매처
  area: string; // 지역
  prfage: string; // 관람연령
}

function parseXml(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.+?)\\]\\]></${tag}>|<${tag}>(.+?)</${tag}>`, "g");
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || "") : "";
}

function parseXmlList(xml: string, itemTag: string): string[] {
  const regex = new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, "g");
  const items: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

export async function fetchPerformanceList(params: {
  stdate: string; // YYYYMMDD
  eddate: string;
  cpage?: number;
  rows?: number;
  shcate?: string; // 장르코드
  shprfnm?: string; // 공연명 검색 키워드
}): Promise<KopisPerformance[]> {
  const searchParams = new URLSearchParams({
    service: getApiKey(),
    stdate: params.stdate,
    eddate: params.eddate,
    cpage: String(params.cpage ?? 1),
    rows: String(params.rows ?? 100),
  });
  if (params.shcate) searchParams.set("shcate", params.shcate);
  if (params.shprfnm) searchParams.set("shprfnm", params.shprfnm);

  const res = await fetch(`${KOPIS_BASE_URL}/pblprfr?${searchParams}`);
  const xml = await res.text();

  const items = parseXmlList(xml, "db");
  return items.map((item) => ({
    mt20id: parseXml(item, "mt20id"),
    prfnm: parseXml(item, "prfnm"),
    prfpdfrom: parseXml(item, "prfpdfrom"),
    prfpdto: parseXml(item, "prfpdto"),
    fcltynm: parseXml(item, "fcltynm"),
    genrenm: parseXml(item, "genrenm"),
    prfstate: parseXml(item, "prfstate"),
    poster: parseXml(item, "poster"),
    openrun: parseXml(item, "openrun"),
  }));
}

export async function fetchPerformanceDetail(
  kopisId: string
): Promise<KopisDetail | null> {
  const res = await fetch(
    `${KOPIS_BASE_URL}/pblprfr/${kopisId}?service=${getApiKey()}`
  );
  const xml = await res.text();

  const items = parseXmlList(xml, "db");
  if (items.length === 0) return null;

  const item = items[0];

  // 예매처 파싱
  const relateItems = parseXmlList(item, "relate");
  const relates = relateItems.map((r) => ({
    relatenm: parseXml(r, "relatenm"),
    relateurl: parseXml(r, "relateurl"),
  }));

  return {
    mt20id: parseXml(item, "mt20id"),
    prfnm: parseXml(item, "prfnm"),
    prfpdfrom: parseXml(item, "prfpdfrom"),
    prfpdto: parseXml(item, "prfpdto"),
    fcltynm: parseXml(item, "fcltynm"),
    genrenm: parseXml(item, "genrenm"),
    prfstate: parseXml(item, "prfstate"),
    poster: parseXml(item, "poster"),
    prfcast: parseXml(item, "prfcast"),
    prfruntime: parseXml(item, "prfruntime"),
    pcseguidance: parseXml(item, "pcseguidance"),
    dtguidance: parseXml(item, "dtguidance"),
    sty: parseXml(item, "sty"),
    relates: { relate: relates },
    area: parseXml(item, "area"),
    prfage: parseXml(item, "prfage"),
  };
}

export function parseKopisDate(dateStr: string): Date {
  // KOPIS format: YYYY.MM.DD or YYYYMMDD
  const cleaned = dateStr.replace(/\./g, "");
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  return new Date(year, month, day);
}

export function mapGenreToCode(genrenm: string): string {
  // KOPIS 장르명: "서양음악(클래식)", "한국음악(국악)", "무용(서양/한국무용)" 등 괄호 포함
  // → includes 매칭으로 처리
  const g = genrenm.toLowerCase();
  if (g.includes("뮤지컬")) return "musical";
  if (g.includes("연극")) return "theater";
  if (g.includes("대중음악") || g.includes("콘서트")) return "concert";
  if (g.includes("클래식") || g.includes("서양음악")) return "classic";
  if (g.includes("무용")) return "dance";
  if (g.includes("국악") || g.includes("한국음악")) return "korean";
  return "etc";
}

export function mapStatusToCode(prfstate: string): string {
  const statusMap: Record<string, string> = {
    공연예정: "upcoming",
    공연중: "ongoing",
    공연완료: "completed",
  };
  return statusMap[prfstate] ?? "upcoming";
}

export function parsePriceRange(
  pcseguidance: string
): { min: number | null; max: number | null } {
  const prices = pcseguidance.match(/[\d,]+원/g);
  if (!prices || prices.length === 0) return { min: null, max: null };

  const numbers = prices.map((p) =>
    parseInt(p.replace(/[,원]/g, ""))
  );
  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
}
