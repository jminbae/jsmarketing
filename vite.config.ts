import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 모든 처리는 브라우저 안에서 일어난다. 서버로 파일을 보내지 않는다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // PDF(pdf-lib+pdfjs)·HEIC 변환 같은 무거운 라이브러리는 도구별로 지연 로딩되어
    // 해당 도구를 열 때만 다운로드된다. 의도된 큰 청크이므로 경고 한도를 올린다.
    chunkSizeWarningLimit: 1600,
  },
})
