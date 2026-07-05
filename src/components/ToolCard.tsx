import { Link } from 'react-router-dom'
import type { ToolMeta } from '../tools/registry'

const CARD_CLASS =
  'group relative flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand hover:shadow-md'

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const isReady = tool.status === 'ready'
  const isExternal = Boolean(tool.href)

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{tool.icon}</span>
        {isReady ? (
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-medium text-brand-dark">
            사용 가능
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-400">
            준비 중
          </span>
        )}
      </div>
      <h3 className="flex items-center gap-1 font-semibold text-base group-hover:text-brand">
        {tool.title}
        {isExternal && (
          <span className="text-gray-400" aria-hidden>
            ↗
          </span>
        )}
      </h3>
      <p className="text-sm leading-relaxed text-gray-500">{tool.description}</p>
      <span className="mt-1 text-[11px] text-gray-400">
        {tool.category}
        {isExternal && ' · 새 창'}
      </span>
    </>
  )

  // 외부 앱으로 연결되는 도구는 새 창 링크로, 그 외에는 내부 라우트로 연다.
  if (tool.href) {
    return (
      <a
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        className={CARD_CLASS}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link to={`/tool/${tool.slug}`} className={CARD_CLASS}>
      {inner}
    </Link>
  )
}
