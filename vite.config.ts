import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 모든 처리는 브라우저 안에서 일어난다. 서버로 파일을 보내지 않는다.
// 상대경로 base('./') + HashRouter 조합으로 GitHub Pages(하위경로)·Vercel(루트)
// 어디에 올려도 같은 빌드가 동작한다(배포 대상별 설정 분기 불필요).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // AI 도구(누끼·업스케일)의 멀티스레드 WASM(SharedArrayBuffer) 활성화를 위한 헤더.
    // credentialless 모드는 SAB 를 켜면서도 cross-origin 모델 CDN 로딩을 허용한다(크롬 기준).
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    // PDF(pdf-lib+pdfjs)·HEIC 변환 같은 무거운 라이브러리는 도구별로 지연 로딩되어
    // 해당 도구를 열 때만 다운로드된다. 의도된 큰 청크이므로 경고 한도를 올린다.
    chunkSizeWarningLimit: 1600,
  },
})
