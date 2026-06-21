import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTool } from '../tools/registry'
import { TOOL_COMPONENTS } from '../router'

export function ToolPage() {
  const { slug } = useParams()
  const tool = slug ? getTool(slug) : undefined

  if (!tool) {
    return (
      <Empty title="없는 도구입니다" body="요청하신 도구를 찾을 수 없습니다.">
        목록으로
      </Empty>
    )
  }

  const LazyTool = TOOL_COMPONENTS[tool.slug]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-sm text-gray-400 hover:text-brand">
          ← 목록으로
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
          <span>{tool.icon}</span>
          {tool.title}
        </h1>
        <p className="mt-1 text-gray-500">{tool.description}</p>
      </div>

      {LazyTool ? (
        <Suspense
          fallback={
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
              불러오는 중…
            </div>
          }
        >
          <LazyTool />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium">🚧 준비 중인 도구입니다</p>
          <p className="mt-1 text-sm text-gray-400">
            곧 사용할 수 있도록 작업하고 있습니다.
          </p>
        </div>
      )}
    </div>
  )
}

function Empty({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{body}</p>
      <Link to="/" className="mt-4 inline-block text-sm text-brand hover:underline">
        {children}
      </Link>
    </div>
  )
}
