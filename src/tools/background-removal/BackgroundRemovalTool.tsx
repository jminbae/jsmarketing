import { useState } from 'react'
import { removeBackground } from '@imgly/background-removal'
import { Dropzone } from '../../components/Dropzone'
import { Card, Button } from '../../components/ui'
import { formatBytes, replaceExt } from '../../lib/image'

interface Result {
  blob: Blob
  url: string
  filename: string
  originalSize: number
}

type Phase = 'download' | 'compute' | null

/** 투명도가 보이도록 결과를 깔아둘 체커보드 배경 스타일. */
const checkerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  backgroundImage:
    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), ' +
    'linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), ' +
    'linear-gradient(45deg, transparent 75%, #e5e7eb 75%), ' +
    'linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
}

export function BackgroundRemovalTool() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [percent, setPercent] = useState(0)

  async function process(files: File[]) {
    const file = files[0]
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    setPhase(null)
    setPercent(0)

    // 이전 미리보기 URL 정리 후 원본 미리보기 준비.
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setOriginalUrl(URL.createObjectURL(file))

    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          setPhase(key.startsWith('fetch') ? 'download' : 'compute')
          setPercent(total > 0 ? Math.round((current / total) * 100) : 0)
        },
      })

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        filename: replaceExt(file.name, 'png').replace(/\.png$/i, '_nobg.png'),
        originalSize: file.size,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '배경 제거 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
      setPhase(null)
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
      <Card className="flex flex-col gap-2 border-brand bg-brand-light">
        <p className="text-sm font-medium text-brand-dark">
          🔒 브라우저 안에서만 처리됩니다 · 서버로 전송되지 않습니다
        </p>
        <p className="text-xs text-gray-500">
          최초 1회 AI 모델(약 40~80MB)을 내려받기 때문에 첫 실행은 다소 느릴 수 있습니다.
          이후에는 캐시되어 빠르게 동작합니다.
        </p>
      </Card>

      <Dropzone
        accept="image/png,image/jpeg"
        onFiles={process}
        hint="JPG·PNG 지원 · 파일은 서버로 전송되지 않습니다"
      />

      {busy && (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">
              {phase === 'download'
                ? '🧠 AI 모델 불러오는 중…'
                : phase === 'compute'
                  ? '✂️ 배경 제거 중…'
                  : '준비 중…'}
            </span>
            <span className="text-gray-400">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

      {(originalUrl || result) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {originalUrl && (
            <Card className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">원본</span>
              <img
                src={originalUrl}
                alt="원본 미리보기"
                className="max-h-80 w-full rounded-lg object-contain"
              />
            </Card>
          )}

          {result && (
            <Card className="flex flex-col gap-3">
              <span className="text-sm font-medium text-gray-600">
                결과 (투명 배경)
              </span>
              <div className="rounded-lg" style={checkerStyle}>
                <img
                  src={result.url}
                  alt="배경 제거 결과"
                  className="max-h-80 w-full rounded-lg object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">{formatBytes(result.blob.size)}</span>
                <Button onClick={download}>⬇️ {result.filename} 다운로드</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
