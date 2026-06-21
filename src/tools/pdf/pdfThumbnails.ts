// pdfjs-dist 를 이용한 PDF 페이지 썸네일 렌더링. 브라우저에서만 동작한다.
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfThumbnail {
  /** 1-base 페이지 번호 */
  pageNumber: number
  /** 렌더된 썸네일 dataURL (PNG) */
  dataUrl: string
}

/**
 * PDF 의 모든 페이지를 썸네일(dataURL)로 렌더한다.
 * @param maxWidth 썸네일 가로 최대 px (기본 200)
 */
export async function renderPdfThumbnails(
  data: ArrayBuffer,
  maxWidth = 200,
): Promise<PdfThumbnail[]> {
  // pdf.js 가 ArrayBuffer 를 detach 하므로 복사본을 넘긴다.
  const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
  const thumbs: PdfThumbnail[] = []
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = Math.min(1, maxWidth / baseViewport.width)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas 2d 컨텍스트를 가져올 수 없습니다.')

      await page.render({ canvasContext: ctx, viewport }).promise
      thumbs.push({ pageNumber, dataUrl: canvas.toDataURL('image/png') })
      page.cleanup()
    }
  } finally {
    await doc.destroy()
  }
  return thumbs
}
