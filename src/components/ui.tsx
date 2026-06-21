import type { ReactNode } from 'react'

/** 라벨 + 입력 묶음. 모든 도구의 폼에서 공통으로 쓴다. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

/** 카드 컨테이너. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 ${className}`}
    >
      {children}
    </div>
  )
}

/** 기본 텍스트 input 스타일. */
export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand'

/** 색상 input (색 선택 + HEX 직접 입력). */
export function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded border border-gray-300"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  )
}

type ButtonVariant = 'primary' | 'outline'

/** 공통 버튼. */
export function Button({
  variant = 'primary',
  className = '',
  ...props
}: { variant?: ButtonVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-brand text-white hover:bg-brand-dark'
      : 'border border-brand text-brand hover:bg-brand-light'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
