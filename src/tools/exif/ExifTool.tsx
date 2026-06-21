import { useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Card, Button } from '../../components/ui'
import { loadImageFromFile, canvasToBlob, formatBytes } from '../../lib/image'

interface Result {
  url: string
  blob: Blob
  filename: string
  originalSize: number
}

export function ExifTool() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function process(files: File[]) {
    const file = files[0]
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const img = await loadImageFromFile(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)

      // 캔버스 재인코딩은 픽셀만 다시 쓰므로 EXIF·GPS·기기정보가 모두 사라진다.
      const isPng = /png$/i.test(file.type)
      const type = isPng ? 'image/png' : 'image/jpeg'
      const ext = isPng ? 'png' : 'jpg'
      const blob = await canvasToBlob(canvas, type, isPng ? undefined : 0.95)

      setResult({
        url: URL.createObjectURL(blob),
        blob,
        filename: file.name.replace(/\.[^.]+$/, `_clean.${ext}`),
        originalSize: file.size,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.filename
    a.click()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-brand-light px-4 py-3 text-sm text-brand-dark">
        촬영 위치(GPS)·기기 정보·촬영 시각 등 숨은 메타데이터를 제거합니다. 환자
        사진을 외부에 공유하기 전 사용하세요.
      </div>

      <Dropzone
        accept="image/jpeg,image/png"
        onFiles={process}
        hint="JPG·PNG 지원 · 처리 후 메타데이터가 모두 제거됩니다"
      />

      {busy && <p className="text-sm text-gray-500">처리 중…</p>}
      {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

      {result && (
        <Card className="flex flex-col gap-4">
          <img
            src={result.url}
            alt="결과 미리보기"
            className="max-h-80 w-full rounded-lg object-contain"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">
              메타데이터 제거 완료 · {formatBytes(result.originalSize)} →{' '}
              {formatBytes(result.blob.size)}
            </span>
            <Button onClick={download}>⬇️ {result.filename} 다운로드</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
