import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { ChevronDown, Download, Play } from 'lucide-react'

/**
 * 說明
 * 這份版本是為了修正「@ 路徑別名」在沙盒環境無法解析的問題。
 * 因此：
 * 1) 移除所有以 "@/" 開頭的 import（包含 assets 與 shadcn 路徑）。
 * 2) 以輕量的本地 UI 元件（SimpleButton / SimpleCard）替代。
 *
 * 目的：
 * - 當「想看什麼技能呢？」選擇「爬蟲」時，展示你的 Pro360 展示版爬蟲：
 *   1) 僅展示「居家清潔」第一頁前三筆。
 *   2) 保留 JSON 優先 / HTML 保底 / 服務頁瀏覽次數 的敘事脈絡。
 *   3) 提供可下載的展示版 Python 與對應 CSV mock。
 *
 * 注意：
 * - 這裡的抓取流程是「展示用模擬」，避免在前端直接實際爬取第三方網站。
 * - 若要上線或做成可長期維護的作品：
 *   建議用後端服務（或雲端函式）執行爬蟲，前端僅展示成果。
 */

// --------------------------------------------
// Minimal UI (替代 shadcn/ui)
// --------------------------------------------

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type SimpleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline'
  size?: 'default' | 'icon'
}

function SimpleButton({
  variant = 'solid',
  size = 'default',
  className,
  children,
  ...rest
}: SimpleButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const solid = 'bg-foreground text-background hover:opacity-90'
  const outline =
    'border border-input bg-background hover:bg-muted/50 text-foreground'

  const sizes: Record<NonNullable<SimpleButtonProps['size']>, string> = {
    default: 'h-10 px-4 py-2 gap-2',
    icon: 'h-10 w-10',
  }

  return (
    <button
      className={cx(
        base,
        variant === 'solid' ? solid : outline,
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

function SimpleCard({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-border bg-background shadow-sm',
        className
      )}
      {...rest}
    />
  )
}

function SimpleCardContent({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-6', className)} {...rest} />
}

// --------------------------------------------
// Scraping demo (展示用模擬)
// --------------------------------------------

type ScrapePhase = 'idle' | 'running' | 'done'

const DEMO_DATA = [
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 A',
    瀏覽次數: 1280,
    雇用次數: 42,
    服務網址: 'https://www.pro360.com.tw/service/123456/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 B',
    瀏覽次數: 860,
    雇用次數: 31,
    服務網址: 'https://www.pro360.com.tw/service/234567/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 C',
    瀏覽次數: 540,
    雇用次數: 18,
    服務網址: 'https://www.pro360.com.tw/service/345678/cleaning',
  },
]

function buildDemoCsv() {
  // debug log
  console.debug('[Pro360Demo] buildDemoCsv: start', {
    rows: DEMO_DATA.length,
  })

  const header = ['類別名稱', '廠商名稱', '瀏覽次數', '雇用次數', '服務網址']
  const lines = [header.join(',')]

  for (const row of DEMO_DATA) {
    const values = header.map((k) => {
      const v = (row as any)[k] ?? ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(',') || s.includes('\n') ? `"${s}"` : s
    })
    lines.push(values.join(','))
  }

  const csv = '\uFEFF' + lines.join('\n')

  // debug log
  console.debug('[Pro360Demo] buildDemoCsv: done', {
    bytes: csv.length,
  })

  return csv
}

function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/plain'
) {
  // debug log
  console.debug('[Pro360Demo] downloadTextFile', {
    filename,
    mime,
    bytes: content.length,
  })

  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Pro360ScrapeShowcase({ autoStart }: { autoStart: boolean }) {
  const [phase, setPhase] = useState<ScrapePhase>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const timerRef = useRef<number | null>(null)
  const stepRef = useRef(0)

  const scriptLines = useMemo(
    () => [
      '$ python pro360_cleaning_demo.py',
      'booting crawler...',
      'loading config: category="居家清潔", page=1, topN=3',
      'try JSON endpoints (GET/POST)...',
      'fallback to HTML parser if needed...',
      'extracting listings (page 1)...',
      'fetching views for 3 services...',
      'normalizing fields...',
      'writing file: pro360_cleaning_demo_YYYYMMDD_HHMM.csv',
      '✅ 資料已爬取完成 (3 records)',
    ],
    []
  )

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
      // debug log
      console.debug('[Pro360Demo] stop interval')
    }
  }

  const start = () => {
    // debug log
    console.debug('[Pro360Demo] start demo')

    stop()
    setPhase('running')
    setLogs([])
    stepRef.current = 0

    timerRef.current = window.setInterval(() => {
      setLogs((prev) => {
        const line = scriptLines[stepRef.current]
        return line ? [...prev, line] : prev
      })

      // debug log
      if (scriptLines[stepRef.current]) {
        console.debug('[Pro360Demo] log step', {
          index: stepRef.current,
          line: scriptLines[stepRef.current],
        })
      }

      stepRef.current += 1

      if (stepRef.current >= scriptLines.length) {
        stop()
        setPhase('done')
        // debug log
        console.debug('[Pro360Demo] demo done')
      }
    }, 420)
  }

  useEffect(() => {
    if (autoStart) {
      // debug log
      console.debug('[Pro360Demo] autoStart')
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  useEffect(() => () => stop(), [])

  const csvContent = useMemo(() => buildDemoCsv(), [])

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">專案展示</p>
          <h3 className="text-xl font-semibold">
            Pro360 居家清潔 Top 3（展示版）
          </h3>
        </div>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Terminal mock */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Run log</p>
          <span
            className={cx(
              'text-xs rounded-full px-2 py-0.5 border',
              phase === 'running' && 'border-foreground/20 text-foreground',
              phase === 'done' && 'border-foreground/20 text-foreground',
              phase === 'idle' && 'border-border text-muted-foreground'
            )}
          >
            {phase === 'idle'
              ? 'ready'
              : phase === 'running'
              ? 'running'
              : 'done'}
          </span>
        </div>
        <div className="mt-3 font-mono text-xs leading-5 text-muted-foreground whitespace-pre-wrap">
          {(logs.length ? logs : ['(waiting for demo...)']).join('\n')}
          {phase === 'running' && (
            <span className="inline-block animate-pulse">▍</span>
          )}
        </div>
      </div>

      {/* Result preview + download */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            爬取結果（居家清潔｜第一頁前三筆｜示範資料）
          </p>
          <div className="mt-3 divide-y">
            {DEMO_DATA.map((row, idx) => (
              <div key={idx} className="py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="font-medium">{row.廠商名稱}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.類別名稱}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>瀏覽 {row.瀏覽次數 ?? '-'} 次</span>
                  <span>•</span>
                  <span>雇用 {row.雇用次數 ?? '-'} 次</span>
                </div>
                <div className="mt-1">
                  <a
                    href={row.服務網址}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.服務網址}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 h-fit">
          <p className="text-sm text-muted-foreground">輸出檔案</p>
          <h4 className="mt-1 text-base font-semibold">
            pro360_cleaning_demo.csv
          </h4>
          <p className="mt-2 text-xs text-muted-foreground">
            對應展示版 Python 的五欄輸出格式（類別名稱／廠商名稱／瀏覽次數／雇用次數／服務網址）。
          </p>
          <SimpleButton
            className="mt-4 w-full"
            disabled={phase !== 'done'}
            onClick={() =>
              downloadTextFile(
                'pro360_cleaning_demo.csv',
                csvContent,
                'text/csv'
              )
            }
            type="button"
          >
            <Download className="h-4 w-4" />
            {phase === 'done' ? '下載文件' : '請先完成演示'}
          </SimpleButton>
        </div>
      </div>

      {/* Safety note */}
      <p className="text-xs text-muted-foreground">
        提示：前端直接對第三方網站進行爬取可能觸發 CORS/風控或違反對方使用規範。
        作品化時建議改為「後端爬取 + 前端展示」。
      </p>
    </div>
  )
}

// --------------------------------------------
// App
// --------------------------------------------

export default function App() {
  // 目前採用沙盒友善寫法（不強依賴本地 assets）
  const aboutImg: string | null = null

  // Experience 圖片同理
  const exp1Img: string | null = null
  const exp2Img: string | null = null

  const skills = useMemo(() => ['爬蟲', 'vibecoding', 'power bi'], [])
  const [selectedSkill, setSelectedSkill] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 md:px-[140px] py-8 max-w-[1440px]">
        <div className="space-y-20 md:space-y-24">
          {/* 導覽列區塊 */}
          <header className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-start">
            {/* 左側欄位：網站名稱 */}
            <div className="flex flex-col items-center md:items-start">
              <h1 className="text-2xl font-bold">網站名稱</h1>
            </div>

            {/* 右側欄位：導航列 */}
            <nav className="flex items-center justify-end gap-6">
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                關於我
              </a>
              <a
                href="#portfolio"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                作品集
              </a>
            </nav>
          </header>

          {/* About Section */}
          <section id="about" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">About</h2>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-start">
              <div className="flex flex-col items-center md:items-start gap-6">
                <div className="w-64 h-64 rounded-full overflow-hidden border-2 border-border shadow-lg">
                  {aboutImg ? (
                    <img
                      src={aboutImg}
                      alt="About"
                      className="w-full h-full object-cover object-[50%_20%]"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">標題</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-center">經歷</h2>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-lg font-semibold">年份</span>
                    <div className="w-12 h-0.5 bg-foreground"></div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
                <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-border">
                  {exp1Img ? (
                    <img
                      src={exp1Img}
                      alt="Experience"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-border order-2 md:order-1">
                  {exp2Img ? (
                    <img
                      src={exp2Img}
                      alt="Experience"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3 order-1 md:order-2">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-lg font-semibold">年份</span>
                    <div className="w-12 h-0.5 bg-foreground"></div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Selection Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">想看什麼技能呢？</h2>

            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      className="flex h-12 w-full appearance-none rounded-lg border border-input bg-background px-4 pr-10 text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">請選擇</option>
                      {skills.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>

                  {selectedSkill ? (
                    <p className="text-sm text-muted-foreground">
                      已選擇：{' '}
                      <span className="text-foreground font-medium">
                        {selectedSkill}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      請從清單中選擇想了解的技能
                    </p>
                  )}

                  {/* 選擇「爬蟲」時嵌入展示頁 */}
                  {selectedSkill === '爬蟲' && (
                    <div className="pt-2">
                      <Pro360ScrapeShowcase autoStart />
                    </div>
                  )}

                  {/* 其他技能的留白提示（可日後擴充） */}
                  {selectedSkill && selectedSkill !== '爬蟲' && (
                    <div className="rounded-xl border border-border bg-muted/10 p-4">
                      <p className="text-sm text-muted-foreground">
                        這個技能展示頁尚在整理中，你可以先選擇「爬蟲」查看 Pro360 的資料展示。
                      </p>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/*
              Manual test checklist
              1) Skills 下拉可正常展開/選取，右側箭頭圖示正確置中。
              2) 選擇「爬蟲」時會自動開始「居家清潔 Top 3」展示。
              3) 終端機 log 會逐行出現，最後顯示「✅ 資料已爬取完成 (3 records)」。
              4) 完成後「下載文件」按鈕可用，會下載 pro360_cleaning_demo.csv。
              5) 「重新演示」可重置 log 並再次播放。
            */}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto px-4 md:px-[140px] py-8 max-w-[1440px] mt-16 border-t">
        <div className="text-center text-sm text-muted-foreground">
          © 2025 • Powered by Cursor's Brain
        </div>
      </footer>
    </div>
  )
}
