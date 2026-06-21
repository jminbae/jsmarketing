# JS 마케팅 스튜디오

주식회사 진솔컴퍼니 마케팅팀 사내 전용 웹툴 모음. 자주 쓰는 이미지·문서·링크 작업을 **한 곳에서**, **모든 처리는 브라우저 안에서**(파일 무전송), **결과는 저장 없이 즉시 다운로드**.

> 피부과 특성상 환자 사진·동의서를 다루므로, 파일을 외부 서버로 보내지 않는 것이 핵심 가치입니다. 모든 연산은 사용자의 브라우저(클라이언트)에서 일어납니다.

## 기술 스택

- **Vite + React + TypeScript**
- **Tailwind CSS v4**
- 정적 SPA (Cloudflare Pages / Vercel / Netlify 등 무료 호스팅 대상)

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 도구 목록

| 도구 | 설명 | 핵심 라이브러리 |
|---|---|---|
| QR 코드 생성기 | 브랜드 색·로고·스타일, SVG/PNG | `qr-code-styling` |
| 이미지 압축·포맷 변환 | WebP/JPG/PNG, HEIC→JPG | `browser-image-compression`, `heic2any` |
| SNS 규격 리사이즈/크롭 | 인스타·유튜브·OG 규격 프리셋 | Canvas |
| EXIF 메타데이터 제거 | GPS·기기정보 세탁 (비식별화) | Canvas |
| 로고 워터마킹 | 텍스트/로고, 위치·투명도 | Canvas |
| UTM 링크 빌더 | 캠페인 추적 링크 생성 | 순수 JS |
| 비포 & 애프터 슬라이더 | 시술 전/후 비교 합성 | Canvas |
| 얼굴·부위 모자이크/블러 | 선택 영역 비식별화 | Canvas |
| PDF 핸들링 | 합치기·분할·이미지→PDF·회전/삭제 | `pdf-lib`, `pdfjs-dist` |
| 이미지 누끼 | AI 배경 제거 (투명 PNG) | `@imgly/background-removal` |
| 이미지 업스케일 | AI 확대 (2/3/4배) | `UpscalerJS` + `@tensorflow/tfjs` |

## 아키텍처

- 각 도구는 `src/tools/<slug>/` 폴더의 자족적 컴포넌트.
- `src/tools/registry.ts` 에 메타데이터 등록 → 대시보드 카드 자동 생성.
- `src/router.tsx` 에서 `React.lazy` 로 **도구별 코드 스플리팅** — 도구를 열 때만 해당 코드(와 무거운 라이브러리)를 다운로드.
- 공용: `src/components/`(Layout, Dropzone, ui), `src/lib/image.ts`.
- 브랜드 토큰: `src/brand.ts` + `src/index.css` 의 `@theme` (현재 임시값, 실 자산 확보 시 교체).

### 도구 추가 절차

1. `src/tools/<slug>/Tool.tsx` 작성 (공용 컴포넌트/유틸 활용)
2. `src/tools/registry.ts` 에 항목 추가 (`status: 'ready'`)
3. `src/router.tsx` 의 `TOOL_COMPONENTS` 에 `lazy` 매핑 추가

## 참고

- AI 도구(누끼·업스케일)는 `SharedArrayBuffer` 사용을 위해 **COOP/COEP 헤더**가 필요합니다. 개발 서버는 `vite.config.ts`, 배포 시에는 `public/_headers`(Cloudflare/Netlify) 등으로 설정합니다.
- 상세 기획은 `마케팅스튜디오_PRD.md` 참조.
