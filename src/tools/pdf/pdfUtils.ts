// PDF 처리 공용 유틸. 모두 브라우저 메모리에서만 동작한다.
import { PDFDocument, degrees } from 'pdf-lib'

/** File/Blob 을 ArrayBuffer 로 읽는다. */
export async function readArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return await file.arrayBuffer()
}

/** pdf-lib 바이트를 PDF Blob 으로 감싼다. */
export function bytesToPdfBlob(bytes: Uint8Array): Blob {
  // ArrayBuffer 슬라이스로 복사해 SharedArrayBuffer 류 타입 충돌을 피한다.
  const copy = new Uint8Array(bytes)
  return new Blob([copy], { type: 'application/pdf' })
}

/** Blob 을 다운로드 트리거. ObjectURL 은 사용 후 해제한다. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // 다운로드가 시작될 시간을 준 뒤 해제.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 확장자를 떼고 베이스 이름만 반환. */
export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

/**
 * "1-3,5,8-10" 같은 페이지 범위 문자열을 0-base 인덱스 배열로 파싱한다.
 * pageCount 범위를 벗어나거나 잘못된 토큰은 무시하며, 입력 순서/중복을 그대로 유지한다.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const result: number[] = []
  const tokens = input.split(',')
  for (const rawToken of tokens) {
    const token = rawToken.trim()
    if (!token) continue
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      if (start < 1 || end < 1) continue
      const step = start <= end ? 1 : -1
      for (let p = start; step > 0 ? p <= end : p >= end; p += step) {
        if (p >= 1 && p <= pageCount) result.push(p - 1)
      }
      continue
    }
    const single = token.match(/^(\d+)$/)
    if (single) {
      const p = parseInt(single[1], 10)
      if (p >= 1 && p <= pageCount) result.push(p - 1)
    }
  }
  return result
}

/** PDF 의 총 페이지 수를 반환한다. */
export async function getPageCount(file: File): Promise<number> {
  const doc = await PDFDocument.load(await readArrayBuffer(file))
  return doc.getPageCount()
}

/** 여러 PDF 파일을 순서대로 병합해 새 PDF 바이트를 반환한다. */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const buf = await readArrayBuffer(file)
    const doc = await PDFDocument.load(buf)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    for (const page of pages) merged.addPage(page)
  }
  return await merged.save()
}

/** 지정한 0-base 페이지 인덱스만 추출한 새 PDF 바이트를 반환한다. */
export async function extractPages(
  file: File,
  pageIndices: number[],
): Promise<Uint8Array> {
  const buf = await readArrayBuffer(file)
  const src = await PDFDocument.load(buf)
  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, pageIndices)
  for (const page of copied) out.addPage(page)
  return await out.save()
}

/** 이미지 파일들을 각 페이지에 한 장씩 담은 PDF 바이트를 반환한다. */
export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (const file of files) {
    const buf = await readArrayBuffer(file)
    const isPng = /image\/png/i.test(file.type) || /\.png$/i.test(file.name)
    const image = isPng
      ? await doc.embedPng(buf)
      : await doc.embedJpg(buf)
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }
  return await doc.save()
}

/** 페이지별 편집(회전 각도 + 삭제 여부)을 적용해 새 PDF 바이트를 반환한다. */
export async function applyPageEdits(
  file: File,
  edits: { rotation: number; deleted: boolean }[],
): Promise<Uint8Array> {
  const buf = await readArrayBuffer(file)
  const doc = await PDFDocument.load(buf)
  const pages = doc.getPages()

  // 회전을 먼저 적용한다. (기존 회전값에 누적)
  pages.forEach((page, i) => {
    const edit = edits[i]
    if (!edit || edit.deleted) return
    if (edit.rotation % 360 !== 0) {
      const current = page.getRotation().angle
      page.setRotation(degrees((current + edit.rotation) % 360))
    }
  })

  // 삭제는 뒤 인덱스부터 제거해 인덱스 밀림을 막는다.
  for (let i = pages.length - 1; i >= 0; i--) {
    if (edits[i]?.deleted) doc.removePage(i)
  }

  return await doc.save()
}
