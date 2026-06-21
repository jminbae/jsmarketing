// 브랜드 자산 — 임시값(placeholder). 실제 자산 확보 시 이 파일만 교체하면 전체 반영된다.
// 로고는 추후 /public 에 SVG/PNG 를 넣고 경로를 연결한다.

export interface BrandPreset {
  id: string
  label: string
  /** 전경색(점/패턴) */
  fg: string
  /** 배경색 */
  bg: string
  /** 로고 경로 (없으면 undefined) */
  logo?: string
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: 'jsmarketing', label: 'JS마케팅', fg: '#2f6f6a', bg: '#ffffff' },
  { id: 'mono', label: '모노(흑백)', fg: '#000000', bg: '#ffffff' },
]

export const BRAND = {
  name: 'JS 마케팅 스튜디오',
  shortName: '마케팅 스튜디오',
}
