// 이미지 처리 공용 유틸. 모두 브라우저 메모리에서만 동작한다.

/** File 을 HTMLImageElement 로 로드한다. (ObjectURL 사용 후 해제) */
export function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

/** Canvas 를 Blob 으로 변환한다. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas toBlob 실패'))),
      type,
      quality,
    )
  })
}

/** 사람이 읽기 쉬운 파일 크기 문자열. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 확장자를 새 확장자로 교체한다. (예: photo.heic → photo.jpg) */
export function replaceExt(filename: string, newExt: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return `${base}.${newExt}`
}
