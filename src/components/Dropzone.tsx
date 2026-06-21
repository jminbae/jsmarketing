import { useRef, useState } from 'react'

interface DropzoneProps {
  /** 허용 파일 타입 (input accept 속성) */
  accept?: string
  /** 여러 파일 허용 여부 */
  multiple?: boolean
  /** 파일이 선택/드롭되면 호출 */
  onFiles: (files: File[]) => void
  /** 안내 문구 */
  hint?: string
}

/** 공용 드래그&드롭 업로더. 파일은 메모리에만 올라가며 서버로 전송되지 않는다. */
export function Dropzone({ accept, multiple = false, onFiles, hint }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    onFiles(Array.from(list))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
        dragging
          ? 'border-brand bg-brand-light'
          : 'border-gray-300 bg-white hover:border-brand'
      }`}
    >
      <span className="text-3xl">📂</span>
      <p className="font-medium">
        파일을 끌어다 놓거나 <span className="text-brand">클릭해서 선택</span>
      </p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
