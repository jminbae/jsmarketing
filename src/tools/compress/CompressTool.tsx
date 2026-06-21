import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button, inputClass } from '../../components/ui'
import { formatBytes, replaceExt } from '../../lib/image'

type OutFormat = 'image/webp' | 'image/jpeg' | 'image/png'

const FORMATS: { value: OutFormat; label: string; ext: string }[] = [
  { value: 'image/webp', label: 'WebP (가장 가벼움·웹 권장)', ext: 'webp' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/png', label: 'PNG (무손실)', ext: 'png' },
]

interface Result {
  blob: Blob
  url: string
  filename: string
  originalSize: number
}

function isHeic(file: File) {
  return (
    /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  )
}

export function CompressTool() {
  const [format, setFormat] = useState<OutFormat>('image/webp')
  const [quality, setQuality] = useState(0.8)
  const [maxDim, setMaxDim] = useState(2000)
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
      let input: Blob = file
      // HEIC/HEIF 는 캔버스가 직접 못 읽으므로 먼저 JPEG 로 변환한다.
      if (isHeic(file)) {
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
        input = Array.isArray(converted) ? converted[0] : converted
      }

      const ext = FORMATS.find((f) => f.value === format)!.ext
      const compressed = await imageCompression(
        new File([input], file.name, { type: input.type || 'image/jpeg' }),
        {
          maxWidthOrHeight: maxDim || undefined,
          useWebWorker: true,
          fileType: format,
          initialQuality: format === 'image/png' ? undefined : quality,
        },
      )

      setResult({
        blob: compressed,
        url: URL.createObjectURL(compressed),
        filename: replaceExt(file.name, ext),
        originalSize: file.size,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환 중 오류가 발생했습니다.')
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

  const savedPct =
    result && result.originalSize > 0
      ? Math.round((1 - result.blob.size / result.originalSize) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <Field label="출력 포맷">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutFormat)}
            className={inputClass}
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>

        {format !== 'image/png' && (
          <Field label={`품질 ${Math.round(quality * 100)}%`}>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="accent-brand"
            />
          </Field>
        )}

        <Field label="최대 크기(긴 변, px)" hint="0 이면 원본 크기 유지">
          <input
            type="number"
            min={0}
            value={maxDim}
            onChange={(e) => setMaxDim(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex flex-col gap-4">
        <Dropzone
          accept="image/*,.heic,.heif"
          onFiles={process}
          hint="JPG·PNG·HEIC 지원 · 파일은 서버로 전송되지 않습니다"
        />

        {busy && <p className="text-sm text-gray-500">변환 중…</p>}
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
                {formatBytes(result.originalSize)} → {formatBytes(result.blob.size)}{' '}
                {savedPct > 0 && (
                  <span className="font-medium text-brand">({savedPct}% 절감)</span>
                )}
              </span>
              <Button onClick={download}>⬇️ {result.filename} 다운로드</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
