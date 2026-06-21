import { useEffect, useMemo, useRef, useState } from 'react'
import QRCodeStyling, { type DotType } from 'qr-code-styling'
import { BRAND_PRESETS } from '../../brand'
import { Field, ColorInput, inputClass } from '../../components/ui'

const DOT_TYPES: { value: DotType; label: string }[] = [
  { value: 'square', label: '사각' },
  { value: 'rounded', label: '둥근' },
  { value: 'dots', label: '점' },
  { value: 'classy', label: '클래시' },
  { value: 'classy-rounded', label: '클래시 둥근' },
  { value: 'extra-rounded', label: '더 둥근' },
]

export function QrTool() {
  const [data, setData] = useState('https://pibutenten.kr')
  const [fg, setFg] = useState('#2f6f6a')
  const [bg, setBg] = useState('#ffffff')
  const [dotType, setDotType] = useState<DotType>('rounded')
  const [logo, setLogo] = useState<string | undefined>(undefined)

  const ref = useRef<HTMLDivElement>(null)

  // QR 인스턴스는 한 번만 생성하고 이후 update 로 갱신한다.
  const qr = useMemo(
    () =>
      new QRCodeStyling({
        width: 280,
        height: 280,
        type: 'svg',
        margin: 8,
      }),
    [],
  )

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ''
      qr.append(ref.current)
    }
  }, [qr])

  useEffect(() => {
    qr.update({
      data: data || ' ',
      dotsOptions: { color: fg, type: dotType },
      backgroundOptions: { color: bg },
      cornersSquareOptions: { color: fg },
      cornersDotOptions: { color: fg },
      image: logo,
      imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
    })
  }, [qr, data, fg, bg, dotType, logo])

  function handleLogo(files: File[]) {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* 설정 패널 */}
      <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6">
        <Field label="내용 (텍스트 또는 URL)">
          <input
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <Field label="브랜드 프리셋">
          <div className="flex flex-wrap gap-2">
            {BRAND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFg(p.fg)
                  setBg(p.bg)
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:border-brand"
              >
                <span
                  className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle"
                  style={{ background: p.fg }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="전경색">
            <ColorInput value={fg} onChange={setFg} />
          </Field>
          <Field label="배경색">
            <ColorInput value={bg} onChange={setBg} />
          </Field>
        </div>

        <Field label="점 모양">
          <select
            value={dotType}
            onChange={(e) => setDotType(e.target.value as DotType)}
            className={inputClass}
          >
            {DOT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="가운데 로고 (선택)">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:border-brand">
              로고 이미지 선택
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleLogo(e.target.files ? Array.from(e.target.files) : [])
                }
              />
            </label>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo(undefined)}
                className="text-sm text-gray-400 hover:text-red-500"
              >
                제거
              </button>
            )}
          </div>
        </Field>
      </div>

      {/* 미리보기 + 다운로드 */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <div ref={ref} className="grid place-items-center" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => qr.download({ name: 'qr', extension: 'svg' })}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
          >
            ⬇️ SVG (인쇄용)
          </button>
          <button
            type="button"
            onClick={() => qr.download({ name: 'qr', extension: 'png' })}
            className="rounded-lg border border-brand px-4 py-2 font-medium text-brand transition hover:bg-brand-light"
          >
            ⬇️ PNG (웹용)
          </button>
        </div>
      </div>
    </div>
  )
}
