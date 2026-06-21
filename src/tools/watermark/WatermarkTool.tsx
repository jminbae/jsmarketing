import { useEffect, useRef, useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button, ColorInput, inputClass } from '../../components/ui'
import { loadImageFromFile, canvasToBlob, replaceExt } from '../../lib/image'

type Mode = 'text' | 'logo'
type Pos =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center-center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

const POSITIONS: Pos[] = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center-center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

export function WatermarkTool() {
  const [base, setBase] = useState<HTMLImageElement | null>(null)
  const [filename, setFilename] = useState('image.png')
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('힐하우스')
  const [textColor, setTextColor] = useState('#ffffff')
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [pos, setPos] = useState<Pos>('bottom-right')
  const [opacity, setOpacity] = useState(0.7)
  const [scale, setScale] = useState(0.2) // 베이스 너비 대비 비율
  const [margin, setMargin] = useState(0.03) // 베이스 너비 대비 비율
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function onBase(files: File[]) {
    const file = files[0]
    if (!file) return
    setFilename(file.name)
    setBase(await loadImageFromFile(file))
  }

  async function onLogo(files: File[]) {
    const file = files[0]
    if (!file) return
    setLogo(await loadImageFromFile(file))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !base) return
    const W = base.naturalWidth
    const H = base.naturalHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(base, 0, 0)

    const m = margin * W
    ctx.globalAlpha = opacity

    if (mode === 'text' && text) {
      const fontSize = scale * W
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = textColor
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(text).width
      const { x, y } = anchor(pos, W, H, tw, fontSize, m)
      ctx.textAlign = 'left'
      // 가독성을 위한 옅은 그림자
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = fontSize * 0.08
      ctx.fillText(text, x, y + fontSize / 2)
      ctx.shadowBlur = 0
    } else if (mode === 'logo' && logo) {
      const lw = scale * W
      const lh = (logo.naturalHeight / logo.naturalWidth) * lw
      const { x, y } = anchor(pos, W, H, lw, lh, m)
      ctx.drawImage(logo, x, y, lw, lh)
    }
    ctx.globalAlpha = 1
  }, [base, mode, text, textColor, logo, pos, opacity, scale, margin])

  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await canvasToBlob(canvas, 'image/png')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = replaceExt(filename, 'png').replace(/\.png$/, '_wm.png')
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <Field label="워터마크 종류">
          <div className="flex gap-2">
            <Seg active={mode === 'text'} onClick={() => setMode('text')}>텍스트</Seg>
            <Seg active={mode === 'logo'} onClick={() => setMode('logo')}>로고 이미지</Seg>
          </div>
        </Field>

        {mode === 'text' ? (
          <>
            <Field label="문구">
              <input value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
            </Field>
            <Field label="글자 색">
              <ColorInput value={textColor} onChange={setTextColor} />
            </Field>
          </>
        ) : (
          <Field label="로고 이미지">
            <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-center text-sm transition hover:border-brand">
              {logo ? '로고 변경' : '로고 선택 (PNG 권장)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogo(e.target.files ? Array.from(e.target.files) : [])}
              />
            </label>
          </Field>
        )}

        <Field label="위치">
          <div className="grid grid-cols-3 gap-1.5">
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPos(p)}
                className={`h-9 rounded border text-xs transition ${
                  pos === p ? 'border-brand bg-brand-light' : 'border-gray-300 hover:border-brand'
                }`}
                aria-label={p}
              >
                {pos === p ? '●' : ''}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`크기 ${Math.round(scale * 100)}%`}>
          <input type="range" min={0.05} max={0.6} step={0.01} value={scale}
            onChange={(e) => setScale(Number(e.target.value))} className="accent-brand" />
        </Field>
        <Field label={`투명도 ${Math.round(opacity * 100)}%`}>
          <input type="range" min={0.1} max={1} step={0.05} value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))} className="accent-brand" />
        </Field>
        <Field label={`여백 ${Math.round(margin * 100)}%`}>
          <input type="range" min={0} max={0.15} step={0.005} value={margin}
            onChange={(e) => setMargin(Number(e.target.value))} className="accent-brand" />
        </Field>
      </Card>

      <div className="flex flex-col gap-4">
        {!base && (
          <Dropzone accept="image/*" onFiles={onBase} hint="워터마크를 넣을 이미지를 올리세요" />
        )}
        {base && (
          <Card className="flex flex-col items-center gap-4">
            <div className="w-full overflow-hidden rounded-lg bg-gray-50 p-2">
              <canvas ref={canvasRef} className="mx-auto max-h-[480px] w-auto max-w-full" />
            </div>
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setBase(null)}>다른 이미지</Button>
              <Button onClick={download}>⬇️ PNG 다운로드</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/** 위치 기준 좌상단 좌표 계산. */
function anchor(pos: Pos, W: number, H: number, w: number, h: number, m: number) {
  const [v, h2] = pos.split('-') as [string, string]
  let x = m
  let y = m
  if (h2 === 'center') x = (W - w) / 2
  else if (h2 === 'right') x = W - w - m
  if (v === 'center') y = (H - h) / 2
  else if (v === 'bottom') y = H - h - m
  return { x, y }
}

function Seg({
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
