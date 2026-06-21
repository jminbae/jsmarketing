import { Link } from 'react-router-dom'
import type { ToolMeta } from '../tools/registry'

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const isReady = tool.status === 'ready'

  return (
    <Link
      to={`/tool/${tool.slug}`}
      className="group relative flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand hover:shadow-md"
    >
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
      <h3 className="font-semibold text-base group-hover:text-brand">
        {tool.title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-500">{tool.description}</p>
      <span className="mt-1 text-[11px] text-gray-400">{tool.category}</span>
    </Link>
  )
}
