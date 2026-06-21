import { useRef, useState } from 'react'
// tfjs 를 부수효과로 import 해야 WebGL/CPU 백엔드가 등록된다. 없으면 런타임에 "No backend" 에러.
import '@tensorflow/tfjs'
import Upscaler from 'upscaler'
import { Dropzone } from '../../components/Dropzone'
import { Card, Field, Button, inputClass } from '../../components/ui'
import { loadImageFromFile, replaceExt } from '../../lib/image'

/** esrgan-slim 이 지원하는 배율 (8x 는 node 전용이라 브라우저에선 제외). */
type Scale = 2 | 3 | 4

const SCALES: { value: Scale; label: string }[] = [
  { value: 2, label: '2배' },
  { value: 3, label: '3배' },
  { value: 4, label: '4배' },
]

interface Source {
  dataUrl: string
  width: number
  height: number
  filename: string
}

interface Result {
  dataUrl: string
  width: number
  height: number
  filename: string
  scale: Scale
}

/** 선택한 배율에 맞는 esrgan-slim 모델을 동적으로 불러온다. (서브패스 import) */
async function loadModel(scale: Scale) {
  switch (scale) {
    case 2:
      return (await import('@upscalerjs/esrgan-slim/2x')).default
    case 3:
      return (await import('@upscalerjs/esrgan-slim/3x')).default
    case 4:
      return (await import('@upscalerjs/esrgan-slim/4x')).default
  }
}

/** data URL 로부터 픽셀 크기를 읽는다. */
function readSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = (e) => reject(e)
    img.src = dataUrl
  })
}

export function UpscaleTool() {
  const [scale, setScale] = useState<Scale>(2)
  const [source, setSource] = useState<Source | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 배율별 Upscaler 인스턴스 캐시. 모델 로딩이 무거우므로 재사용한다.
  const upscalerCache = useRef<Map<Scale, InstanceType<typeof Upscaler>>>(new Map())

  async function getUpscaler(s: Scale) {
    const cached = upscalerCache.current.get(s)
    if (cached) return cached
    const model = await loadModel(s)
    const instance = new Upscaler({ model })
    upscalerCache.current.set(s, instance)
    return instance
  }

  async function onFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const img = await loadImageFromFile(file)
      // 캔버스를 거쳐 data URL 로 만든다. (HEIC 등 비표준 포맷은 미지원)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
      ctx.drawImage(img, 0, 0)
      setSource({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.naturalWidth,
        height: img.naturalHeight,
        filename: file.name,
      })
    } catch {
      setError('이미지를 불러올 수 없습니다. JPG·PNG·WebP 파일을 사용하세요.')
      setSource(null)
    }
  }

  async function run() {
    if (!source || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const upscaler = await getUpscaler(scale)
      const dataUrl = await upscaler.upscale(source.dataUrl, {
        output: 'base64',
        patchSize: 64, // 큰 이미지에서 메모리 부족(OOM)을 막기 위해 패치 단위로 처리
        padding: 2,
        progress: (rate: number) => setProgress(Math.round(rate * 100)),
      })
      const { width, height } = await readSize(dataUrl)
      setResult({
        dataUrl,
        width,
        height,
        filename: replaceExt(source.filename, 'png'),
        scale,
      })
    } catch (e) {
      setError(
        e instanceof Error
          ? `업스케일에 실패했습니다: ${e.message}`
          : '업스케일 중 오류가 발생했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.dataUrl
    a.download = result.filename
    a.click()
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <Field label="확대 배율" hint="배율이 클수록 더 오래 걸립니다">
          <select
            value={scale}
            onChange={(e) => {
              setScale(Number(e.target.value) as Scale)
              setResult(null)
            }}
            disabled={busy}
            className={inputClass}
          >
            {SCALES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Button onClick={run} disabled={!source || busy}>
          {busy ? `업스케일 중… ${progress}%` : '✨ 업스케일'}
        </Button>

        <p className="text-xs leading-relaxed text-gray-400">
          썸네일·로고처럼 작은 이미지를 AI로 또렷하게 확대합니다. 큰 이미지는
          수십 초가 걸릴 수 있어요. 처리에는 브라우저의 WebGL/WebGPU 가속을
          사용하며, 이미지는 서버로 전송되지 않습니다.
        </p>
      </Card>

      <div className="flex flex-col gap-4">
        <Dropzone
          accept="image/png,image/jpeg,image/webp"
          onFiles={onFiles}
          hint="JPG·PNG·WebP 지원 · 작은 이미지에 적합 · 파일은 서버로 전송되지 않습니다"
        />

        {busy && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-gray-500">
              AI 모델로 업스케일 중… {progress}%
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

        {source && (
          <Card className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-600">원본</span>
            <img
              src={source.dataUrl}
              alt="원본 미리보기"
              className="max-h-72 w-full rounded-lg object-contain"
            />
            <span className="text-sm text-gray-500">
              {source.width} × {source.height} px
            </span>
          </Card>
        )}

        {result && (
          <Card className="flex flex-col gap-3">
            <span className="text-sm font-medium text-brand-dark">
              결과 ({result.scale}배)
            </span>
            <img
              src={result.dataUrl}
              alt="업스케일 결과 미리보기"
              className="max-h-96 w-full rounded-lg object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">
                {result.width} × {result.height} px
              </span>
              <Button onClick={download}>⬇️ {result.filename} 다운로드</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
