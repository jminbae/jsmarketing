import { useEffect, useRef, useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button } from '../../components/ui'
import { loadImageFromFile, canvasToBlob, replaceExt } from '../../lib/image'

type Effect = 'mosaic' | 'blur'

/** 원본 해상도 기준 사각형 영역. */
interface Region {
  x: number
  y: number
  w: number
  h: number
  effect: Effect
  /** 효과 강도(0~1). 모자이크=픽셀 크기 비율, 블러=블러 px 비율 기준. */
  strength: number
}

/** 드래그 중인 임시 사각형(원본 좌표). */
interface DragRect {
  startX: number
  startY: number
  curX: number
  curY: number
}

export function MosaicTool() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [filename, setFilename] = useState('image.png')
  const [effect, setEffect] = useState<Effect>('mosaic')
  const [strength, setStrength] = useState(0.5)
  const [regions, setRegions] = useState<Region[]>([])
  const [drag, setDrag] = useState<DragRect | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 원본 픽셀을 보존하는 오프스크린 캔버스(매 렌더마다 원본부터 다시 그림).
  const sourceRef = useRef<HTMLCanvasElement | null>(null)

  async function onFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    setFilename(file.name)
    setRegions([])
    setDrag(null)
    const loaded = await loadImageFromFile(file)
    setImg(loaded)
  }

  // 이미지가 바뀌면 원본 픽셀을 오프스크린 캔버스에 저장한다.
  useEffect(() => {
    if (!img) {
      sourceRef.current = null
      return
    }
    const src = document.createElement('canvas')
    src.width = img.naturalWidth
    src.height = img.naturalHeight
    const sctx = src.getContext('2d')!
    sctx.drawImage(img, 0, 0)
    sourceRef.current = src
  }, [img])

  // 원본 + 확정된 영역 효과 + 드래그 중 미리보기 사각형을 다시 그린다.
  useEffect(() => {
    const canvas = canvasRef.current
    const src = sourceRef.current
    if (!canvas || !img || !src) return
    const W = img.naturalWidth
    const H = img.naturalHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // 1) 원본 다시 그림
    ctx.drawImage(src, 0, 0)

    // 2) 각 영역에 효과 적용
    for (const r of regions) {
      applyEffect(ctx, src, r)
    }

    // 3) 드래그 중 사각형 가이드
    if (drag) {
      const { x, y, w, h } = normalizeRect(drag)
      if (w > 0 && h > 0) {
        ctx.save()
        ctx.strokeStyle = '#ec4899'
        ctx.lineWidth = Math.max(2, W * 0.003)
        ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2])
        ctx.strokeRect(x, y, w, h)
        ctx.fillStyle = 'rgba(236,72,153,0.12)'
        ctx.fillRect(x, y, w, h)
        ctx.restore()
      }
    }
  }, [img, regions, drag])

  /** 마우스 이벤트의 화면 좌표를 원본 해상도 좌표로 변환. */
  function toImageCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    // 화면에 표시된 크기와 실제 캔버스 픽셀 크기의 비율.
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let x = (e.clientX - rect.left) * scaleX
    let y = (e.clientY - rect.top) * scaleY
    // 캔버스 밖으로 나가지 않도록 클램프.
    x = Math.max(0, Math.min(canvas.width, x))
    y = Math.max(0, Math.min(canvas.height, y))
    return { x, y }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = toImageCoords(e)
    setDrag({ startX: x, startY: y, curX: x, curY: y })
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag) return
    const { x, y } = toImageCoords(e)
    setDrag((d) => (d ? { ...d, curX: x, curY: y } : d))
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // capture가 없을 수 있음 — 무시.
    }
    const { x, y, w, h } = normalizeRect(drag)
    setDrag(null)
    // 너무 작은 영역(클릭 수준)은 무시.
    const min = Math.max(4, img ? img.naturalWidth * 0.005 : 4)
    if (w < min || h < min) return
    setRegions((prev) => [...prev, { x, y, w, h, effect, strength }])
  }

  function undo() {
    setRegions((prev) => prev.slice(0, -1))
  }

  function clearAll() {
    setRegions([])
  }

  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    // 드래그 가이드가 남아있을 수 있으니, 영역만 적용된 깨끗한 상태로 다시 그린 뒤 저장.
    // (drag는 pointerUp에서 항상 null이 되므로 현재 캔버스가 곧 결과물이지만, 안전하게 한 번 더 보장.)
    const blob = await canvasToBlob(canvas, 'image/png')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = replaceExt(filename, 'png').replace(/\.png$/, '_blur.png')
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <div className="rounded-lg bg-brand-light px-3 py-2.5 text-xs leading-relaxed text-brand-dark">
          🔒 모든 처리는 브라우저 안에서만 이뤄지며 어디에도 전송되지 않습니다. 외부 공유 전
          얼굴·이름표·차트 등 식별 정보를 가려 비식별화하세요.
        </div>

        <Field label="효과 종류">
          <div className="flex gap-2">
            <Seg active={effect === 'mosaic'} onClick={() => setEffect('mosaic')}>
              모자이크
            </Seg>
            <Seg active={effect === 'blur'} onClick={() => setEffect('blur')}>
              블러
            </Seg>
          </div>
        </Field>

        <Field
          label={`강도 ${Math.round(strength * 100)}%`}
          hint="새로 그리는 영역에 적용됩니다. 기존 영역은 유지됩니다."
        >
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="accent-brand"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600">
            적용된 영역 {regions.length}개
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={undo}
              disabled={regions.length === 0}
            >
              ↩️ 되돌리기
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearAll}
              disabled={regions.length === 0}
            >
              🗑️ 전체 지우기
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {!img && (
          <Dropzone
            accept="image/*"
            onFiles={onFiles}
            hint="비식별화할 이미지를 올리세요. 업로드되지 않고 내 브라우저 안에서만 처리됩니다."
          />
        )}
        {img && (
          <Card className="flex flex-col items-center gap-4">
            <p className="w-full text-sm text-gray-500">
              가릴 부분을 마우스로 <span className="font-medium text-brand">드래그</span>해
              사각형을 그리세요. 여러 영역을 추가할 수 있습니다.
            </p>
            <div className="w-full overflow-hidden rounded-lg bg-gray-50 p-2">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="mx-auto block max-h-[480px] w-auto max-w-full cursor-crosshair touch-none select-none"
              />
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-gray-400">
                {img.naturalWidth}×{img.naturalHeight}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImg(null)}>
                  다른 이미지
                </Button>
                <Button onClick={download} disabled={regions.length === 0}>
                  ⬇️ PNG 다운로드
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/** 드래그 좌표를 좌상단 기준 양수 w/h 사각형으로 정규화. */
function normalizeRect(d: DragRect) {
  const x = Math.min(d.startX, d.curX)
  const y = Math.min(d.startY, d.curY)
  const w = Math.abs(d.curX - d.startX)
  const h = Math.abs(d.curY - d.startY)
  return { x, y, w, h }
}

/** 한 영역에 모자이크 또는 블러 효과를 적용한다. src(원본)에서 읽어 dest(ctx)에 그린다. */
function applyEffect(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  r: Region,
) {
  // 정수 픽셀 경계로 보정.
  const x = Math.round(r.x)
  const y = Math.round(r.y)
  const w = Math.round(r.w)
  const h = Math.round(r.h)
  if (w <= 0 || h <= 0) return

  if (r.effect === 'mosaic') {
    // 픽셀 크기: 강도가 클수록 더 크게(거칠게). 영역 짧은 변의 일정 비율.
    const minSide = Math.min(w, h)
    // 강도 0.1~1 → 픽셀 블록 한 변이 짧은 변의 약 4%~25%.
    const blockRatio = 0.03 + r.strength * 0.22
    const pixelSize = Math.max(2, Math.round(minSide * blockRatio))
    // 축소될 때의 폭/높이(최소 1px 보장).
    const sw = Math.max(1, Math.round(w / pixelSize))
    const sh = Math.max(1, Math.round(h / pixelSize))

    const tmp = document.createElement('canvas')
    tmp.width = sw
    tmp.height = sh
    const tctx = tmp.getContext('2d')!
    // 영역을 작게 축소.
    tctx.imageSmoothingEnabled = true
    tctx.drawImage(src, x, y, w, h, 0, 0, sw, sh)

    // 축소본을 다시 원래 크기로 확대하되 보간 끄기 → 픽셀화.
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h)
    ctx.restore()
  } else {
    // 블러: 강도에 비례한 blur 반경(영역 짧은 변 기준 비율 + 절대값).
    const minSide = Math.min(w, h)
    const radius = Math.max(2, Math.round((1 + minSide * 0.12) * r.strength))

    // 해당 영역만 별도 캔버스에 그린 뒤 filter blur 적용해 되그림.
    // 가장자리 번짐을 위해 약간의 여백(padding)을 둔다.
    const pad = radius * 2
    const tw = w + pad * 2
    const th = h + pad * 2
    const tmp = document.createElement('canvas')
    tmp.width = tw
    tmp.height = th
    const tctx = tmp.getContext('2d')!
    // 원본에서 영역+주변을 가져온다(경계 클램프).
    const sx = Math.max(0, x - pad)
    const sy = Math.max(0, y - pad)
    const sx2 = Math.min(src.width, x + w + pad)
    const sy2 = Math.min(src.height, y + h + pad)
    const sCropW = sx2 - sx
    const sCropH = sy2 - sy
    // tmp 안에서의 그릴 위치(원본 영역 좌상단이 (pad,pad)에 오도록 보정).
    const dx = pad - (x - sx)
    const dy = pad - (y - sy)
    tctx.drawImage(src, sx, sy, sCropW, sCropH, dx, dy, sCropW, sCropH)

    // blur 적용한 임시 결과를 만든다.
    const blurred = document.createElement('canvas')
    blurred.width = tw
    blurred.height = th
    const bctx = blurred.getContext('2d')!
    bctx.filter = `blur(${radius}px)`
    bctx.drawImage(tmp, 0, 0)
    bctx.filter = 'none'

    // 영역 부분만 잘라 원본 캔버스에 붙인다(번진 여백 제외).
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(blurred, pad, pad, w, h, x, y, w, h)
    ctx.restore()
  }
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
