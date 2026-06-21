import { useCallback, useEffect, useRef, useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button } from '../../components/ui'
import { loadImageFromFile, canvasToBlob } from '../../lib/image'

/**
 * 비포&애프터 슬라이더 도구.
 * 시술 전/후 사진을 좌우 비교 슬라이더로 미리보고,
 * 분할선 위치 기준 합성 PNG 1장으로 다운로드한다.
 * 모든 처리는 브라우저 메모리에서만 동작한다.
 */

/** 두 이미지를 cover 방식으로 맞출 공통 크기를 계산한다. */
function computeCommonSize(
  before: HTMLImageElement,
  after: HTMLImageElement,
): { w: number; h: number } {
  // 두 이미지 중 더 작은 쪽(픽셀 면적 기준)을 기준 크기로 삼는다.
  const beforeArea = before.width * before.height
  const afterArea = after.width * after.height
  const base = beforeArea <= afterArea ? before : after
  return { w: base.width, h: base.height }
}

/** 한 이미지를 대상 크기에 cover(꽉 채우기) 방식으로 그린다. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const dx = (w - dw) / 2
  const dy = (h - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

/** 합성 캔버스를 그린다. split: 0~100 (왼쪽 before 비율). */
function renderComposite(
  canvas: HTMLCanvasElement,
  before: HTMLImageElement,
  after: HTMLImageElement,
  split: number,
  showLabels: boolean,
) {
  const { w, h } = computeCommonSize(before, after)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  const splitX = (split / 100) * w

  // 왼쪽: before
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, splitX, h)
  ctx.clip()
  drawCover(ctx, before, w, h)
  ctx.restore()

  // 오른쪽: after
  ctx.save()
  ctx.beginPath()
  ctx.rect(splitX, 0, w - splitX, h)
  ctx.clip()
  drawCover(ctx, after, w, h)
  ctx.restore()

  // 분할선 (얇은 흰색 구분선)
  const lineW = Math.max(2, Math.round(w / 400))
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fillRect(splitX - lineW / 2, 0, lineW, h)

  if (showLabels) {
    const fontSize = Math.max(16, Math.round(w / 28))
    const pad = Math.round(fontSize * 0.6)
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textBaseline = 'top'

    drawLabel(ctx, '전', pad, pad, fontSize, pad, 'left')
    drawLabel(ctx, '후', w - pad, pad, fontSize, pad, 'right')
  }
}

/** 둥근 배경을 가진 라벨을 그린다. align 에 따라 x 가 왼쪽/오른쪽 기준. */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  pad: number,
  align: 'left' | 'right',
) {
  const metrics = ctx.measureText(text)
  const boxW = metrics.width + pad * 2
  const boxH = fontSize + pad * 1.2
  const boxX = align === 'left' ? x : x - boxW
  const textX = boxX + pad

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  roundRect(ctx, boxX, y, boxW, boxH, pad * 0.6)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, textX, y + pad * 0.6)
}

/** 둥근 사각형 path 를 그린다 (구형 브라우저 호환용 수동 구현). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function BeforeAfterTool() {
  const [before, setBefore] = useState<HTMLImageElement | null>(null)
  const [after, setAfter] = useState<HTMLImageElement | null>(null)
  const [split, setSplit] = useState(50)
  const [showLabels, setShowLabels] = useState(true)
  const [dragging, setDragging] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const ready = before !== null && after !== null

  async function onBefore(files: File[]) {
    const file = files[0]
    if (!file) return
    setBefore(await loadImageFromFile(file))
  }

  async function onAfter(files: File[]) {
    const file = files[0]
    if (!file) return
    setAfter(await loadImageFromFile(file))
  }

  // 미리보기 영역에서 포인터 위치 → split(%) 환산.
  const updateSplitFromClientX = useCallback((clientX: number) => {
    const el = previewRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width === 0) return
    const ratio = (clientX - rect.left) / rect.width
    setSplit(Math.min(100, Math.max(0, ratio * 100)))
  }, [])

  // 드래그 중 전역 포인터 이벤트로 부드럽게 추적한다.
  useEffect(() => {
    if (!dragging) return
    function onMove(e: PointerEvent) {
      updateSplitFromClientX(e.clientX)
    }
    function onUp() {
      setDragging(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, updateSplitFromClientX])

  async function download() {
    if (!before || !after) return
    const canvas = canvasRef.current
    if (!canvas) return
    renderComposite(canvas, before, after, split, showLabels)
    const blob = await canvasToBlob(canvas, 'image/png')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'before-after.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  // 미리보기 종횡비: 공통 크기 기준 (정렬 어긋남 방지).
  const aspect =
    before && after
      ? (() => {
          const { w, h } = computeCommonSize(before, after)
          return `${w} / ${h}`
        })()
      : undefined

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* 설정 패널 */}
      <Card className="flex flex-col gap-5">
        <Field label="시술 전 사진 (before)">
          {before ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span className="text-gray-600">
                {before.width}×{before.height}
              </span>
              <button
                type="button"
                onClick={() => setBefore(null)}
                className="text-gray-400 hover:text-red-500"
              >
                교체
              </button>
            </div>
          ) : (
            <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-center text-sm transition hover:border-brand">
              전 사진 선택
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onBefore(e.target.files ? Array.from(e.target.files) : [])
                }
              />
            </label>
          )}
        </Field>

        <Field label="시술 후 사진 (after)">
          {after ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span className="text-gray-600">
                {after.width}×{after.height}
              </span>
              <button
                type="button"
                onClick={() => setAfter(null)}
                className="text-gray-400 hover:text-red-500"
              >
                교체
              </button>
            </div>
          ) : (
            <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-center text-sm transition hover:border-brand">
              후 사진 선택
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onAfter(e.target.files ? Array.from(e.target.files) : [])
                }
              />
            </label>
          )}
        </Field>

        <Field label="분할선 위치" hint={`왼쪽 ${Math.round(split)}% 가 '전' 사진`}>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="w-full accent-brand"
            disabled={!ready}
          />
        </Field>

        <Field label="라벨 표시">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            좌상단 '전' / 우상단 '후' 표시
          </label>
        </Field>
      </Card>

      {/* 미리보기 + 다운로드 */}
      <div className="flex flex-col gap-4">
        {!ready && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!before && (
              <Dropzone
                accept="image/*"
                onFiles={onBefore}
                hint="시술 전 사진을 올려주세요"
              />
            )}
            {!after && (
              <Dropzone
                accept="image/*"
                onFiles={onAfter}
                hint="시술 후 사진을 올려주세요"
              />
            )}
            {(before || after) && (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
                {before
                  ? '후 사진까지 올리면 비교 슬라이더가 나타납니다'
                  : '전 사진까지 올리면 비교 슬라이더가 나타납니다'}
              </div>
            )}
          </div>
        )}

        {ready && before && after && (
          <Card className="flex flex-col items-center gap-4">
            {/* 인터랙티브 비교 슬라이더 */}
            <div
              ref={previewRef}
              onPointerDown={(e) => {
                e.preventDefault()
                setDragging(true)
                updateSplitFromClientX(e.clientX)
              }}
              className="relative mx-auto w-full max-w-full touch-none select-none overflow-hidden rounded-lg bg-gray-50"
              style={{ aspectRatio: aspect, maxHeight: 480 }}
            >
              {/* after (배경 전체) */}
              <img
                src={after.src}
                alt="시술 후"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* before (왼쪽만 보이도록 clip) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              >
                <img
                  src={before.src}
                  alt="시술 전"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {showLabels && (
                <>
                  <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-xs font-bold text-white">
                    전
                  </span>
                  <span className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 text-xs font-bold text-white">
                    후
                  </span>
                </>
              )}

              {/* 분할선 + 핸들 */}
              <div
                className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow"
                style={{ left: `${split}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-brand shadow-md">
                  ↔
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              분할선을 드래그하거나 왼쪽 슬라이더로 위치를 조절하세요.
            </p>

            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-gray-400">
                합성 크기 {computeCommonSize(before, after).w}×
                {computeCommonSize(before, after).h}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBefore(null)
                    setAfter(null)
                  }}
                >
                  다시 시작
                </Button>
                <Button onClick={download}>⬇️ 합성 PNG 다운로드</Button>
              </div>
            </div>
          </Card>
        )}

        {/* 다운로드용 오프스크린 캔버스 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
