import { useEffect, useRef, useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button, ColorInput, inputClass } from '../../components/ui'
import { loadImageFromFile, canvasToBlob, replaceExt } from '../../lib/image'

interface Preset {
  id: string
  label: string
  w: number
  h: number
}

const PRESETS: Preset[] = [
  { id: 'ig-square', label: '인스타 정사각 1:1', w: 1080, h: 1080 },
  { id: 'ig-portrait', label: '인스타 세로 4:5', w: 1080, h: 1350 },
  { id: 'story', label: '스토리·릴스 9:16', w: 1080, h: 1920 },
  { id: 'yt-thumb', label: '유튜브 썸네일 16:9', w: 1280, h: 720 },
  { id: 'og', label: 'OG·페북 카드 1.91:1', w: 1200, h: 630 },
]

type FitMode = 'cover' | 'contain'

export function ResizeTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [filename, setFilename] = useState('image.png')
  const [preset, setPreset] = useState<Preset>(PRESETS[0])
  const [custom, setCustom] = useState({ w: 1080, h: 1080 })
  const [useCustom, setUseCustom] = useState(false)
  const [mode, setMode] = useState<FitMode>('cover')
  const [bg, setBg] = useState('#ffffff')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const target = useCustom ? custom : { w: preset.w, h: preset.h }

  async function onFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    setFilename(file.name)
    setImg(await loadImageFromFile(file))
  }

  // 설정이 바뀔 때마다 캔버스에 다시 그린다.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    canvas.width = target.w
    canvas.height = target.h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, target.w, target.h)

    if (mode === 'contain') {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, target.w, target.h)
    }

    const scale =
      mode === 'cover'
        ? Math.max(target.w / img.width, target.h / img.height)
        : Math.min(target.w / img.width, target.h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = (target.w - dw) / 2
    const dy = (target.h - dh) / 2
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [img, target.w, target.h, mode, bg])

  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await canvasToBlob(canvas, 'image/png')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = replaceExt(filename, 'png')
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <Field label="규격 프리셋">
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreset(p)
                  setUseCustom(false)
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  !useCustom && preset.id === p.id
                    ? 'border-brand bg-brand-light'
                    : 'border-gray-300 hover:border-brand'
                }`}
              >
                {p.label}{' '}
                <span className="text-xs text-gray-400">
                  {p.w}×{p.h}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                useCustom
                  ? 'border-brand bg-brand-light'
                  : 'border-gray-300 hover:border-brand'
              }`}
            >
              직접 입력
            </button>
          </div>
        </Field>

        {useCustom && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="너비(px)">
              <input
                type="number"
                value={custom.w}
                onChange={(e) => setCustom((c) => ({ ...c, w: Number(e.target.value) }))}
                className={inputClass}
              />
            </Field>
            <Field label="높이(px)">
              <input
                type="number"
                value={custom.h}
                onChange={(e) => setCustom((c) => ({ ...c, h: Number(e.target.value) }))}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label="맞춤 방식">
          <div className="flex gap-2">
            <ModeBtn active={mode === 'cover'} onClick={() => setMode('cover')}>
              꽉 채우기(크롭)
            </ModeBtn>
            <ModeBtn active={mode === 'contain'} onClick={() => setMode('contain')}>
              여백 넣기
            </ModeBtn>
          </div>
        </Field>

        {mode === 'contain' && (
          <Field label="여백 색">
            <ColorInput value={bg} onChange={setBg} />
          </Field>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {!img && (
          <Dropzone accept="image/*" onFiles={onFiles} hint="이미지를 올리면 미리보기가 나타납니다" />
        )}
        {img && (
          <Card className="flex flex-col items-center gap-4">
            <div className="w-full overflow-hidden rounded-lg bg-gray-50 p-2">
              <canvas
                ref={canvasRef}
                className="mx-auto max-h-[480px] w-auto max-w-full"
              />
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-gray-400">
                {target.w}×{target.h}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImg(null)}>
                  다른 이미지
                </Button>
                <Button onClick={download}>⬇️ PNG 다운로드</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
        active ? 'border-brand bg-brand-light' : 'border-gray-300 hover:border-brand'
      }`}
    >
      {children}
    </button>
  )
}
