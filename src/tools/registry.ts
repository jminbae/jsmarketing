// 도구 레지스트리 — 모든 웹툴을 한 곳에서 등록한다.
// 새 도구를 추가할 때: 1) 페이지 컴포넌트 작성  2) 여기에 항목 등록  3) router 에 라우트 연결.

export type ToolStatus = 'ready' | 'soon'

export type ToolCategory = '이미지' | '문서' | '링크' | '비식별화'

export interface ToolMeta {
  /** URL 경로 (/tool/:slug) 및 고유 키 */
  slug: string
  title: string
  /** 카드에 보일 한 줄 설명 */
  description: string
  category: ToolCategory
  /** 이모지 아이콘 (임시) */
  icon: string
  status: ToolStatus
}

export const TOOLS: ToolMeta[] = [
  // ── 1단계: 즉효 도구 ─────────────────────────────
  {
    slug: 'qr',
    title: 'QR 코드 생성기',
    description: '텍스트·URL을 브랜드 색·로고가 들어간 QR로. SVG/PNG 다운로드.',
    category: '링크',
    icon: '🔳',
    status: 'ready',
  },
  {
    slug: 'image-compress',
    title: '이미지 압축·포맷 변환',
    description: 'WebP/JPG/PNG 변환, 용량 압축, HEIC→JPG.',
    category: '이미지',
    icon: '🗜️',
    status: 'ready',
  },
  {
    slug: 'image-resize',
    title: 'SNS 규격 리사이즈/크롭',
    description: '인스타·유튜브 썸네일 등 규격 프리셋으로 맞춤.',
    category: '이미지',
    icon: '📐',
    status: 'ready',
  },
  {
    slug: 'exif-remove',
    title: 'EXIF 메타데이터 제거',
    description: '촬영 위치·기기 정보를 세탁한 깨끗한 이미지.',
    category: '비식별화',
    icon: '🧹',
    status: 'ready',
  },
  {
    slug: 'watermark',
    title: '로고 워터마킹',
    description: '로고·텍스트 워터마크를 위치·투명도 조절해 삽입.',
    category: '이미지',
    icon: '💧',
    status: 'ready',
  },
  {
    slug: 'utm-builder',
    title: 'UTM 링크 빌더',
    description: '캠페인 추적 파라미터를 붙인 링크를 손쉽게 생성.',
    category: '링크',
    icon: '🔗',
    status: 'ready',
  },
  // ── 2단계: 중간 난이도 ─────────────────────────────
  {
    slug: 'before-after',
    title: '비포 & 애프터 슬라이더',
    description: '시술 전/후 사진을 좌우 비교로 합성.',
    category: '이미지',
    icon: '🪞',
    status: 'ready',
  },
  {
    slug: 'mosaic',
    title: '얼굴·부위 모자이크/블러',
    description: '선택 영역을 모자이크·블러로 비식별화.',
    category: '비식별화',
    icon: '🌫️',
    status: 'ready',
  },
  {
    slug: 'pdf',
    title: 'PDF 핸들링',
    description: '합치기·분할·회전·이미지→PDF 변환.',
    category: '문서',
    icon: '📄',
    status: 'ready',
  },
  // ── 3단계: AI 도구 (후순위) ─────────────────────────
  {
    slug: 'background-removal',
    title: '이미지 누끼 (배경 제거)',
    description: '브라우저 AI로 배경 제거. 사진이 서버로 나가지 않음.',
    category: '이미지',
    icon: '✂️',
    status: 'soon',
  },
  {
    slug: 'upscale',
    title: '작은 이미지 업스케일',
    description: '썸네일·로고 등 작은 이미지를 AI로 확대.',
    category: '이미지',
    icon: '🔍',
    status: 'soon',
  },
]

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug)
}
