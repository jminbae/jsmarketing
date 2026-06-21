import { useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { Field, Card, Button, inputClass } from '../../components/ui'
import { formatBytes } from '../../lib/image'
import {
  mergePdfs,
  extractPages,
  imagesToPdf,
  applyPageEdits,
  parsePageRanges,
  bytesToPdfBlob,
  downloadBlob,
  baseName,
  readArrayBuffer,
  getPageCount,
} from './pdfUtils'
import { renderPdfThumbnails, type PdfThumbnail } from './pdfThumbnails'

type Tab = 'merge' | 'split' | 'images' | 'edit'

const TABS: { id: Tab; label: string }[] = [
  { id: 'merge', label: '합치기' },
  { id: 'split', label: '분할' },
  { id: 'images', label: '이미지→PDF' },
  { id: 'edit', label: '회전/삭제' },
]

export function PdfTool() {
  const [tab, setTab] = useState<Tab>('merge')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-brand text-white'
                : 'border border-gray-300 text-gray-600 hover:border-brand hover:text-brand'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'merge' && <MergePanel />}
      {tab === 'split' && <SplitPanel />}
      {tab === 'images' && <ImagesPanel />}
      {tab === 'edit' && <EditPanel />}
    </div>
  )
}

/** 공통 상태/에러 표시. */
function Status({ busy, error }: { busy: boolean; error: string | null }) {
  return (
    <>
      {busy && <p className="text-sm text-gray-500">처리 중…</p>}
      {error && <p className="text-sm text-red-500">⚠️ {error}</p>}
    </>
  )
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.'
}

// ──────────────────────────────────────── 합치기 ────────────────────────────────────────
function MergePanel() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFiles(incoming: File[]) {
    setFiles((prev) => [...prev, ...incoming])
    setError(null)
  }

  function move(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function run() {
    if (files.length < 2) {
      setError('PDF 파일을 2개 이상 추가하세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const bytes = await mergePdfs(files)
      downloadBlob(bytesToPdfBlob(bytes), 'merged.pdf')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept="application/pdf,.pdf"
        multiple
        onFiles={addFiles}
        hint="여러 PDF 를 추가한 뒤 순서를 정해 하나로 합칩니다 · 서버로 전송되지 않습니다"
      />

      {files.length > 0 && (
        <Card className="flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm"
            >
              <span className="w-6 text-center font-medium text-brand">{i + 1}</span>
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-gray-400">{formatBytes(f.size)}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="px-1 text-gray-400 hover:text-brand disabled:opacity-30"
                title="위로"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === files.length - 1}
                className="px-1 text-gray-400 hover:text-brand disabled:opacity-30"
                title="아래로"
              >
                ▼
              </button>
              <button
                onClick={() => remove(i)}
                className="px-1 text-gray-400 hover:text-red-500"
                title="제거"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="mt-2 flex justify-end">
            <Button onClick={run} disabled={busy || files.length < 2}>
              ⬇️ 합쳐서 다운로드
            </Button>
          </div>
        </Card>
      )}

      <Status busy={busy} error={error} />
    </div>
  )
}

// ──────────────────────────────────────── 분할 ────────────────────────────────────────
function SplitPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [ranges, setRanges] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(files: File[]) {
    const f = files[0]
    if (!f) return
    setFile(f)
    setError(null)
    setBusy(true)
    try {
      setPageCount(await getPageCount(f))
    } catch (e) {
      setError(errMsg(e))
      setFile(null)
    } finally {
      setBusy(false)
    }
  }

  async function run() {
    if (!file) return
    const indices = parsePageRanges(ranges, pageCount)
    if (indices.length === 0) {
      setError('유효한 페이지 범위를 입력하세요. 예: 1-3,5,8-10')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const bytes = await extractPages(file, indices)
      downloadBlob(bytesToPdfBlob(bytes), `${baseName(file.name)}_split.pdf`)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col gap-5">
        <Field
          label="페이지 범위"
          hint={
            pageCount > 0
              ? `총 ${pageCount}페이지 · 예: 1-3,5,8-10`
              : '예: 1-3,5,8-10'
          }
        >
          <input
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="1-3,5,8-10"
            className={inputClass}
          />
        </Field>
        <Button onClick={run} disabled={busy || !file}>
          ⬇️ 추출해서 다운로드
        </Button>
      </Card>

      <div className="flex flex-col gap-4">
        <Dropzone
          accept="application/pdf,.pdf"
          onFiles={pick}
          hint="PDF 1개를 올린 뒤 추출할 페이지 범위를 입력하세요"
        />
        {file && (
          <p className="text-sm text-gray-500">
            {file.name} · {formatBytes(file.size)}
            {pageCount > 0 && ` · ${pageCount}페이지`}
          </p>
        )}
        <Status busy={busy} error={error} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────── 이미지→PDF ────────────────────────────────────────
function ImagesPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFiles(incoming: File[]) {
    const imgs = incoming.filter(
      (f) => /image\/(png|jpeg)/i.test(f.type) || /\.(png|jpe?g)$/i.test(f.name),
    )
    if (imgs.length === 0) {
      setError('JPG 또는 PNG 이미지만 추가할 수 있습니다.')
      return
    }
    setFiles((prev) => [...prev, ...imgs])
    setError(null)
  }

  function move(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function run() {
    if (files.length === 0) {
      setError('이미지를 1장 이상 추가하세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const bytes = await imagesToPdf(files)
      downloadBlob(bytesToPdfBlob(bytes), 'images.pdf')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        multiple
        onFiles={addFiles}
        hint="JPG·PNG 여러 장을 한 PDF 로 묶습니다 (한 장당 한 페이지)"
      />

      {files.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex flex-col gap-1 rounded-lg border border-gray-100 p-2"
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="h-28 w-full rounded object-contain"
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-brand">{i + 1}</span>
                  <span className="flex gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-brand disabled:opacity-30"
                      title="앞으로"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1}
                      className="text-gray-400 hover:text-brand disabled:opacity-30"
                      title="뒤로"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => remove(i)}
                      className="text-gray-400 hover:text-red-500"
                      title="제거"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={run} disabled={busy || files.length === 0}>
              ⬇️ PDF 로 만들기
            </Button>
          </div>
        </Card>
      )}

      <Status busy={busy} error={error} />
    </div>
  )
}

// ──────────────────────────────────────── 회전/삭제 ────────────────────────────────────────
interface PageState {
  rotation: number
  deleted: boolean
}

function EditPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [thumbs, setThumbs] = useState<PdfThumbnail[]>([])
  const [pages, setPages] = useState<PageState[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(files: File[]) {
    const f = files[0]
    if (!f) return
    setFile(f)
    setError(null)
    setBusy(true)
    setThumbs([])
    setPages([])
    try {
      const buf = await readArrayBuffer(f)
      const rendered = await renderPdfThumbnails(buf)
      setThumbs(rendered)
      setPages(rendered.map(() => ({ rotation: 0, deleted: false })))
    } catch (e) {
      setError(errMsg(e))
      setFile(null)
    } finally {
      setBusy(false)
    }
  }

  function rotate(index: number) {
    setPages((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    )
  }

  function toggleDelete(index: number) {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, deleted: !p.deleted } : p)),
    )
  }

  async function run() {
    if (!file) return
    if (pages.every((p) => p.deleted)) {
      setError('모든 페이지를 삭제할 수는 없습니다.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const bytes = await applyPageEdits(file, pages)
      downloadBlob(bytesToPdfBlob(bytes), `${baseName(file.name)}_edited.pdf`)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept="application/pdf,.pdf"
        onFiles={pick}
        hint="PDF 를 올리면 페이지 썸네일이 표시됩니다 · 회전(90°)/삭제 후 내보내기"
      />

      <Status busy={busy} error={error} />

      {thumbs.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {thumbs.map((t, i) => {
              const state = pages[i]
              return (
                <div
                  key={t.pageNumber}
                  className={`flex flex-col gap-2 rounded-lg border p-2 ${
                    state?.deleted
                      ? 'border-red-300 bg-red-50 opacity-50'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex h-32 items-center justify-center overflow-hidden rounded bg-gray-50">
                    <img
                      src={t.dataUrl}
                      alt={`${t.pageNumber}페이지`}
                      className="max-h-full max-w-full object-contain transition-transform"
                      style={{ transform: `rotate(${state?.rotation ?? 0}deg)` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-brand">{t.pageNumber}p</span>
                    <span className="flex gap-2">
                      <button
                        onClick={() => rotate(i)}
                        className="text-gray-500 hover:text-brand"
                        title="90° 회전"
                      >
                        ↻ 회전
                      </button>
                      <button
                        onClick={() => toggleDelete(i)}
                        className={
                          state?.deleted
                            ? 'text-brand hover:text-brand-dark'
                            : 'text-gray-500 hover:text-red-500'
                        }
                        title={state?.deleted ? '삭제 취소' : '삭제'}
                      >
                        {state?.deleted ? '↺ 복원' : '✕ 삭제'}
                      </button>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={run} disabled={busy}>
              ⬇️ 편집본 다운로드
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
