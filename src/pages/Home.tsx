import { TOOLS } from '../tools/registry'
import { ToolCard } from '../components/ToolCard'

export function Home() {
  const readyCount = TOOLS.filter((t) => t.status === 'ready').length

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold">마케팅 웹툴 모음</h1>
        <p className="mt-2 text-gray-500">
          자주 쓰는 이미지·문서·링크 작업을 한 곳에서. 모든 처리는 브라우저
          안에서 일어나며, 파일은 외부로 전송되지 않습니다.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          사용 가능 {readyCount}개 · 전체 {TOOLS.length}개
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </section>
    </div>
  )
}
