import { Link, Outlet } from 'react-router-dom'
import { BRAND } from '../brand'

export function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white text-sm font-bold">
              JS
            </span>
            <span className="font-semibold text-lg">{BRAND.name}</span>
          </Link>
          <span className="text-xs text-gray-400">
            파일은 서버로 전송되지 않습니다 · 브라우저 내 처리
          </span>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-gray-400">
          © 진솔컴퍼니 · 사내 전용 도구 · 결과물은 저장 없이 즉시 다운로드됩니다.
        </div>
      </footer>
    </div>
  )
}
