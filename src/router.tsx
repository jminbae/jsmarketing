import { createBrowserRouter } from 'react-router-dom'
import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { ToolPage } from './pages/ToolPage'

// 구현된 도구의 페이지 컴포넌트를 slug 에 매핑한다.
// 각 도구는 React.lazy 로 지연 로딩 → 해당 도구를 열 때만 코드(와 무거운 라이브러리)가
// 다운로드된다. 첫 진입 시 메인 번들을 가볍게 유지하기 위함(PRD: 최초 로딩 부담 완화).
// 도구를 새로 만들면 여기에 한 줄 추가하면 라우팅이 연결된다.
// (아직 미구현 도구는 ToolPage 가 "준비 중" 안내를 보여준다.)
export const TOOL_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  qr: lazy(() => import('./tools/qr/QrTool').then((m) => ({ default: m.QrTool }))),
  'image-compress': lazy(() =>
    import('./tools/compress/CompressTool').then((m) => ({ default: m.CompressTool })),
  ),
  'image-resize': lazy(() =>
    import('./tools/resize/ResizeTool').then((m) => ({ default: m.ResizeTool })),
  ),
  'exif-remove': lazy(() =>
    import('./tools/exif/ExifTool').then((m) => ({ default: m.ExifTool })),
  ),
  watermark: lazy(() =>
    import('./tools/watermark/WatermarkTool').then((m) => ({ default: m.WatermarkTool })),
  ),
  'utm-builder': lazy(() =>
    import('./tools/utm/UtmTool').then((m) => ({ default: m.UtmTool })),
  ),
  'before-after': lazy(() =>
    import('./tools/before-after/BeforeAfterTool').then((m) => ({
      default: m.BeforeAfterTool,
    })),
  ),
  mosaic: lazy(() =>
    import('./tools/mosaic/MosaicTool').then((m) => ({ default: m.MosaicTool })),
  ),
  pdf: lazy(() => import('./tools/pdf/PdfTool').then((m) => ({ default: m.PdfTool }))),
  'background-removal': lazy(() =>
    import('./tools/background-removal/BackgroundRemovalTool').then((m) => ({
      default: m.BackgroundRemovalTool,
    })),
  ),
  upscale: lazy(() =>
    import('./tools/upscale/UpscaleTool').then((m) => ({ default: m.UpscaleTool })),
  ),
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tool/:slug', element: <ToolPage /> },
    ],
  },
])
