# CLAUDE.md — 프로젝트 작업 안내 (모든 컴퓨터 공통)

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽습니다.
> **다른 컴퓨터에서 이어받을 때**: 이 파일 + README.md + `git log --oneline`을 먼저 보고 파악하세요.

## 무엇인가
**JS 마케팅 스튜디오** — 진솔컴퍼니 마케팅팀 사내 전용 웹툴 모음.
브라우저에서 100% 처리(파일 무전송), 결과 즉시 다운로드. 상세 기획은 [마케팅스튜디오_PRD.md](마케팅스튜디오_PRD.md).

## 기술 스택
Vite + React + TypeScript + Tailwind CSS v4. 정적 SPA.

## 실행
```bash
npm install      # 새 컴퓨터에서 처음 1회 (node_modules는 git에 없음)
npm run dev      # 개발 서버 http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
```

## 도구 추가 절차
1. `src/tools/<slug>/Tool.tsx` 작성 (공용 컴포넌트·유틸 활용: `src/components/ui.tsx`, `src/components/Dropzone.tsx`, `src/lib/image.ts`)
2. `src/tools/registry.ts`에 메타 등록 (`status: 'ready'`)
3. `src/router.tsx`의 `TOOL_COMPONENTS`에 `lazy(() => import(...))` 매핑 추가

## 여러 컴퓨터에서 작업하는 법 (중요)
- **GitHub가 본체입니다.** 컴퓨터 간 이동은 Dropbox 말고 git으로:
  - 작업 시작 전: `git pull`
  - 작업 끝: `git push`
- 클로드 자동 메모리(`~/.claude/...`)는 컴퓨터마다 따로라 공유 안 됨 → **공유할 맥락은 이 CLAUDE.md에 적어두기.**
- 컴퓨터 바꿀 때: ① `git pull` ② (처음이면) `npm install` ③ 작업

---

## 현재 상태 (작업 로그)
> 새 작업을 하면 여기에 한두 줄씩 갱신하세요. 다음 세션/다른 컴퓨터가 이걸 보고 이어갑니다.

### 2026-06-22
- **QR 다운로드 버그 수정**: URL 바꾼 뒤 PNG 저장 시 첫 결과가 계속 저장되던 버그. 원인 = qr-code-styling `type:'svg'` 인스턴스는 `update()`가 내부 canvas를 갱신하지 않음(첫 `_domCanvas` 재사용). 해결 = 다운로드 시 현재 옵션으로 **새 인스턴스** 생성 후 내보내기. 실제 UI 시나리오로 검증(서로 다른 PNG 출력 확인). 내용 없을 땐 저장 버튼 비활성화.
- **배포 설정 통합**: 상대경로 `base: './'` + **HashRouter** → GitHub Pages·Vercel 등 어디 올려도 같은 빌드가 동작(분기 제거). 라이브(gh-pages) 재배포 완료.
- 전체 도구 다운로드 패턴 점검 — QR 외 나머지는 매 저장마다 결과를 새로 생성해서 동일 버그 없음.

### 2026-06-21
- **트랙 1 웹툴 11종 전부 완성·검증 완료**: QR, 이미지 압축·변환, 리사이즈/크롭, EXIF 제거, 워터마킹, UTM 빌더, 비포&애프터, 모자이크/블러, PDF(합치기·분할·이미지→PDF·회전/삭제), 누끼(@imgly), 업스케일(UpscalerJS).
- 도구별 `React.lazy` 코드 스플리팅으로 초기 번들 경량화.
- **GitHub**: https://github.com/jminbae/jsmarketing (공개 repo).
- **배포(현재 라이브)**: GitHub Pages → https://jminbae.github.io/jsmarketing/ (gh-pages 브랜치, `npx gh-pages -d dist --dotfiles`로 재배포).
- **Vercel(선택, 미연결)**: `vercel.json` 준비됨(SPA rewrites + COOP/COEP + X-Robots-Tag). 연결 시 누끼 풀스피드 + 깔끔한 URL. 사용자는 Vercel Pro 보유.
- 검색 차단: meta robots noindex + robots.txt + (배포)X-Robots-Tag.
- 브랜드: 표시명 "JS 마케팅 스튜디오", 프리셋 JS마케팅·모노. (구 명칭 힐하우스/피부텐텐 제거됨)

### 다음 후보 (PRD 기준, 미착수)
- 트랙 2(로컬 설치형): 영상 자막(Whisper), 대용량 영상 변환, 영상 업스케일, **릴스 템플릿 자동화**.
- 공유 시술명 사전(Supabase `procedures_master` / `asr_aliases`).
