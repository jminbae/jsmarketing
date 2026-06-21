import { useMemo, useState } from 'react'
import { Field, Card, Button, inputClass } from '../../components/ui'

const SOURCE_PRESETS = ['instagram', 'youtube', 'naver', 'kakao', 'facebook', 'blog']
const MEDIUM_PRESETS = ['social', 'cpc', 'post', 'story', 'bio', 'email']

export function UtmTool() {
  const [base, setBase] = useState('')
  const [source, setSource] = useState('instagram')
  const [medium, setMedium] = useState('social')
  const [campaign, setCampaign] = useState('')
  const [term, setTerm] = useState('')
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  const { url, valid } = useMemo(() => {
    if (!base.trim()) return { url: '', valid: false }
    try {
      const u = new URL(base.trim())
      const add = (k: string, v: string) => {
        if (v.trim()) u.searchParams.set(k, v.trim())
      }
      add('utm_source', source)
      add('utm_medium', medium)
      add('utm_campaign', campaign)
      add('utm_term', term)
      add('utm_content', content)
      return { url: u.toString(), valid: true }
    } catch {
      return { url: '', valid: false }
    }
  }, [base, source, medium, campaign, term, content])

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-5">
        <Field label="기본 URL" hint="추적 파라미터를 붙일 대상 링크">
          <input
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <Field label="utm_source (유입 출처)">
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} />
          <Chips values={SOURCE_PRESETS} onPick={setSource} />
        </Field>

        <Field label="utm_medium (매체)">
          <input value={medium} onChange={(e) => setMedium(e.target.value)} className={inputClass} />
          <Chips values={MEDIUM_PRESETS} onPick={setMedium} />
        </Field>

        <Field label="utm_campaign (캠페인명)">
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="예: summer_event"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="utm_term (선택)">
            <input value={term} onChange={(e) => setTerm(e.target.value)} className={inputClass} />
          </Field>
          <Field label="utm_content (선택)">
            <input value={content} onChange={(e) => setContent(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <span className="text-sm font-medium text-gray-600">생성된 링크</span>
        {valid ? (
          <div className="break-all rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-700">
            {url}
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
            올바른 URL을 입력하세요 (http:// 또는 https:// 포함).
          </div>
        )}
        <Button onClick={copy} disabled={!valid}>
          {copied ? '✅ 복사됨' : '📋 링크 복사'}
        </Button>
      </Card>
    </div>
  )
}

function Chips({ values, onPick }: { values: string[]; onPick: (v: string) => void }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 transition hover:border-brand hover:text-brand"
        >
          {v}
        </button>
      ))}
    </div>
  )
}
