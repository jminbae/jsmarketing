interface DownloadButtonProps {
  /** 다운로드할 데이터 (Blob 또는 data/object URL) */
  data: Blob | string
  /** 저장될 파일명 */
  filename: string
  children?: React.ReactNode
  disabled?: boolean
}

/** 결과물을 즉시 내려받는 공용 버튼. 서버 저장 없이 메모리에서 바로 다운로드한다. */
export function DownloadButton({
  data,
  filename,
  children,
  disabled,
}: DownloadButtonProps) {
  function handleDownload() {
    const url = typeof data === 'string' ? data : URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    if (typeof data !== 'string') {
      // ObjectURL 은 사용 후 해제해 메모리 누수를 막는다.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
    >
      ⬇️ {children ?? '다운로드'}
    </button>
  )
}
