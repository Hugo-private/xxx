import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from 'lucide-react'

/**
 * 說明
 * 這份版本是為了修正「@ 路徑別名」在沙盒環境無法解析的問題。
 * 因此：
 * 1) 移除所有以 "@/" 開頭的 import（包含 assets 與 shadcn 路徑）。
 * 2) 以輕量的本地 UI 元件（SimpleButton）替代。
 *
 * 目前展示規則（依你最新需求彙整）：
 * - 爬蟲：保留 Run log，且為「動態逐行輸出」展示版本。
 * - Power BI：不顯示 Run log。
 * - 輸出檔案區塊：已移除（兩個技能都不再呈現）。
 * - Power BI 成果摘要：以 GIF 呈現，旁邊搭配卡片說明。
 *
 * GIF 放置方式（建議）：
 * - 請將你提供的 GIF 檔（01.gif）放到 public/ 目錄。
 * - 這樣就能用 <img src="/01.gif" /> 直接引用。
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
    'inline-flex items-center justify-center rounded-full text-[15px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const solid =
    'bg-accent text-accent-foreground shadow-[0_12px_24px_-20px_rgba(34,195,166,0.9)] hover:bg-accent-hover'
  const outline =
    'border border-input bg-surface/80 text-foreground hover:border-foreground/20 hover:bg-accent-soft hover:shadow-sm active:border-accent'

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

// --------------------------------------------
// Theme
// --------------------------------------------

type ThemeMode = 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function useThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      applyTheme(next)
      return next
    })
  }

  return { theme, toggle }
}

// --------------------------------------------
// Scraping demo (展示用模擬)
// --------------------------------------------

const DEMO_DATA = [
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 A',
    瀏覽次數: 1280,
    雇用次數: 42,
    服務網址: 'https://www.xxx.com.tw/service/123456/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 B',
    瀏覽次數: 860,
    雇用次數: 31,
    服務網址: 'https://www.xxx.com.tw/service/234567/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 C',
    瀏覽次數: 540,
    雇用次數: 18,
    服務網址: 'https://www.xxx.com.tw/service/345678/cleaning',
  },
]

const SCRAPE_LOG_SCRIPT = [
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
]

type RunLogState = {
  lines: string[]
  isRunning: boolean
  isDone: boolean
}

function useSimulatedRunLog(script: string[], speedMs = 220) {
  const [state, setState] = useState<RunLogState>({
    lines: [],
    isRunning: true,
    isDone: false,
  })
  const timerRef = useRef<number | null>(null)
  const indexRef = useRef(0)

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = () => {
    stop()
    indexRef.current = 0
    setState({ lines: [], isRunning: true, isDone: false })

    timerRef.current = window.setInterval(() => {
      const i = indexRef.current
      if (i >= script.length) {
        stop()
        setState((s) => ({ ...s, isRunning: false, isDone: true }))
        return
      }

      const nextLine = script[i]
      indexRef.current += 1

      setState((s) => ({
        ...s,
        lines: [...s.lines, nextLine],
      }))
    }, speedMs)
  }

  useEffect(() => {
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script.join('||'), speedMs])

  return { ...state, restart: start }
}

function Pro360ScrapeShowcase() {
  const log = useSimulatedRunLog(SCRAPE_LOG_SCRIPT, 200)
  const logBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = logBoxRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [log.lines.length])

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
          網站數據爬取
        </h3>
        <p className="text-sm text-secondary">
          因應主管提出競品數據分析需求，評估當時工程人力有限為避免影響既有開發排程，主動承擔資料蒐集任務，自行學習並實作網站數據爬取技術，以補足決策所需資訊。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
          <li>自行撰寫爬蟲程式，蒐集競品網站之公開市場數據</li>
          <li>
            將爬取資料輸出成 Excel，提供主管作為
            {' '}
            <strong>競品研究與市場觀察</strong>之決策參考
          </li>
          <li>在不增加工程負擔的前提下，提升資訊取得時程與決策效率</li>
        </ul>
      </div>

      <div className="card-muted space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SimpleButton
            type="button"
            variant="outline"
            size="default"
            onClick={log.restart}
            className="h-9 px-3"
            title="重新播放"
          >
            <RotateCcw className="h-4 w-4" />
            重新播放
          </SimpleButton>
        </div>

        {/* Run log（動態示範） */}
        <div
          ref={logBoxRef}
          className="max-h-[220px] overflow-auto card-tight"
        >
          <pre
            className="min-h-[128px] whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
{log.lines.join('\n')}
{log.isRunning ? '\n▍' : ''}
          </pre>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cx(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border',
              log.isDone
                ? 'border-foreground/20 bg-foreground/5 text-foreground'
                : 'border-border bg-surface text-muted-foreground'
            )}
          >
            {log.isDone ? '已完成（示意）' : '執行中（示意）'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            
          </span>
        </div>

        {/* 爬取結果：等 log 跑完才顯示 */}
        {log.isDone && (
          <div className="card-compact">
            <p className="text-sm text-secondary">
              爬取結果（居家清潔｜第一頁前三筆｜示範資料）
            </p>
            <div className="mt-3 divide-y">
              {DEMO_DATA.map((row, idx) => (
                <div key={idx} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-medium">{row.廠商名稱}</p>
                    <p className="text-sm text-secondary">{row.類別名稱}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                    <span>瀏覽 {row.瀏覽次數 ?? '-'} 次</span>
                    <span>•</span>
                    <span>雇用 {row.雇用次數 ?? '-'} 次</span>
                  </div>
                  <div className="mt-1">
                    <a
                      href={row.服務網址}
                      className="text-sm text-secondary hover:text-foreground underline underline-offset-4"
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
        )}
      </div>
    </div>
  )
}

// --------------------------------------------
// Power BI demo (展示用模擬)
// --------------------------------------------

const PBI_KPI_MOCK = [
  { label: '毛利率 最大值', value: '40.0%', note: '依賣場/規格切片' },
  { label: '毛利率 平均', value: '25.9%', note: '整體概覽' },
  { label: '毛利率 最小值', value: '10.0%', note: '風險監控' },
]
void PBI_KPI_MOCK

const POWER_BI_GIF_SRC = '/01.gif'

function PowerBIDemoShowcase() {
  const [gifOk, setGifOk] = useState(true)

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
          Power BI 整體毛利率監控
        </h3>
        <p className="text-sm text-secondary">
          因應系統大型改版進行成本規劃時，發現既有供應商成本設定規則繁雜，僅透過表格與文件難以快速理解整體結構與使用者實際設定狀況，為提升分析與溝通效率，主動學習 Power BI 報表製作與資料視覺化，輔助成本規劃與功能設計判斷。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
          <li>建立「最大/平均/最小」三層毛利摘要，對齊不同管理視角</li>
          <li>透過多維切片快速定位毛利異常與供給風險來源</li>
          <li>將觀察轉化為可執行的價格、成本與派單策略調整</li>
        </ul>
      </div>

      <div className="card-muted">
        
        <div className="mt-3 inline-block">
          {gifOk ? (
            <img
              src={POWER_BI_GIF_SRC}
              alt="Power BI demo"
              className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
              onError={() => setGifOk(false)}
            />
          ) : (
            <div className="flex items-center justify-center px-4 py-10 text-center">
              <p className="text-sm text-secondary">
                尚未找到 GIF。請將 01.gif 放到 public/ 後重試。
              </p>
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-sm text-secondary">
          (示意圖皆為假資料)
        </p>
        <p className="mt-2 text-center text-sm text-secondary">
          將數據以卡片、表格與圖表方式視覺化呈現，並可依賣場、供應商、地區與規格進行即時篩選。
        </p>

        {/* KPI 小卡已移除 */}
      </div>
    </div>
  )
}

// --------------------------------------------
// App content versions
// --------------------------------------------

type AppVersion = 'resume' | 'report-2025'

type Experience = {
  title: string
  company?: string
  summary?: readonly string[]
  period?: string
  highlights?: readonly string[]
  tags?: readonly string[]
}

type ReportOtherProject = {
  id: string
  title: string
  dateLabel: string
  dateRange: string
  highlights: readonly string[]
  tags: readonly string[]
}

const VERSION_ALIASES: Record<string, AppVersion> = {
  resume: 'resume',
  cv: 'resume',
  report: 'report-2025',
  'report-2025': 'report-2025',
  '2025': 'report-2025',
}

function getInitialVersion(): AppVersion {
  if (typeof window === 'undefined') return 'resume'
  const raw = new URLSearchParams(window.location.search)
    .get('version')
    ?.toLowerCase()
  return raw && VERSION_ALIASES[raw] ? VERSION_ALIASES[raw] : 'resume'
}

const RESUME_SKILLS = [
  { id: 'vibecoding', label: 'Vibe Coding' },
  { id: 'power bi', label: 'Power BI' },
  { id: '爬蟲', label: '爬蟲' },
  { id: 'figma', label: 'Figma' },
  { id: 'notion', label: 'Notion' },
  { id: 'side project', label: 'Side project' },
] as const

const RESUME_EXPERIENCES = [
  {
    title: '網站企劃專員',
    company: 'HoHo好服務好生活',
    summary: [
      '是一個提供生活服務的電商平台，致力於整合優質服務供應商，為消費者提供安心、透明且便利的到府服務體驗。',
    ],
    period: '2023.06月 — 至今',
    highlights: [
      '規劃官網與後台系統架構，產出 Wireframe / 流程圖，協助跨部門對齊需求。',
      '擬定專案上線時程，追蹤進度並控管交付品質。',
      '撰寫需求文件、執行專案測試與上線維運，確保平台穩定運作。',
    ],
    tags: ['需求分析', 'Wireframe', '流程設計', '跨部門協作', '專案管理'],
  },
  {
    title: '專案名稱：系統改版',
    summary: [
      '隨著系統長期迭代，既有架構累積多項效能問題與歷史 Bug，同時提高後續功能開發與維運成本。',
      '為改善系統穩定性與可擴充性，啟動系統改版專案，以「系能優化與系統邏輯」為核心方向，',
      '重新盤點系統問題並規劃優化方案，作為後續功能發展的基礎。',
    ],
    period: '2024/11/01 ～ 進行中',
    highlights: [
      '系統性盤點既有 Bug 與流程痛點，協助釐清問題成因，作為系統改版與優化優先順序之依據',
      '針對效能與架構問題提出改善方向，降低系統複雜度，為後續功能開發建立更穩定的基礎',
      '以降低維運成本與加速開發效率為目標，協助推動系統逐步重構與優化',
    ],
    tags: ['系統改版', '效能優化', '降低維運成本', '跨部門協作', '專案管理'],
  },
  {
    title: '專案名稱：會員載具大平台歸戶',
    summary: [
      '因應財政部對電子發票與會員載具歸戶機制之規範要求，既有系統在歸戶流程與使用體驗上存在限制與潛在風險',
      '為確保法規遵循並提升消費者操作體驗，啟動會員載具大平台歸戶專案，',
      '規劃導入「會員載具統一歸戶入口」服務，同步優化相關系統流程。',
    ],
    period: '2025/10/22 ～ 進行中',
    highlights: [
      '系統性盤點既有 Bug 與流程痛點，協助釐清問題成因，作為系統改版與優化優先順序之依據',
      '針對效能與架構問題提出改善方向，降低系統複雜度，為後續功能開發建立更穩定的基礎',
      '以降低維運成本與加速開發效率為目標，協助推動系統逐步重構與優化',
    ],
    tags: ['法規遵循', '電子發票', '系統整合', '流程優化', '使用者體驗優化'],
  },
  {
    title: '專案名稱：子帳號及臨時工實名制',
    summary: [
      '因公司於稽核過程中被發現現場雇用外籍人士，法務單位要求全面檢視並補強供應商人員管理制度。',
      '為符合法規要求並降低營運風險，啟動子帳號及臨時工實名制專案',
      '規劃對所有供應商服務師傅導入「實名制驗證」與「個資同意書簽署」機制，以確保人員身分合規並保障公司權益。',
    ],
    period: '2025/11/07 ～ 進行中',
    highlights: [
      '依循法務與法規要求，協助規劃供應商子帳號與臨時工之實名制驗證流程，降低用工與法遵風險',
      '建立個資同意書簽署機制，確保資料蒐集與使用符合個資法規範，提升制度完整性與可稽核性',
      '盤點既有人員管理流程並進行制度化調整，使供應商人員管理由人工控管轉為系統化、可追蹤的管理流程',
    ],
    tags: ['系統改版', '效能優化', '降低維運成本', '跨部門協作', '專案管理'],
  },
] as const satisfies readonly Experience[]

const REPORT_EXPERIENCES = [
  {
    title: '專案名稱：系統改版',
    summary: [
      '隨著系統長期迭代，既有架構累積多項效能問題與歷史 Bug，同時提高後續功能開發與維運成本。為改善系統穩定性與可擴充性，啟動系統改版專案，以「Bug 處理與系統改善」為核心方向，重新盤點系統問題並規劃優化方案，作為後續功能發展的基礎。',
    ],
    period: '2024/11/1 ～ 進行中',
    highlights: [
      '盤點歷史 Bug 與效能瓶頸，整理可追蹤的問題清單與成因',
      '規劃系統優化與重構路線，提升穩定性與可擴充性',
      '降低維運成本並改善開發效率，建立後續功能發展基礎',
    ],
    tags: [
      '系統改版',
      'Bug 處理',
      '效能優化',
      '技術債盤點',
      '維運成本降低',
      '跨部門協作',
    ],
  },
  {
    title: '專案名稱：會員載具大平台歸戶',
    summary: [
      '因財政部對電子發票與會員載具歸戶機制之規範要求，既有系統在歸戶流程與使用體驗上存在限制與潛在風險。為確保法規遵循並提升消費者操作體驗，啟動會員載具大平台歸戶專案，規劃導入「會員載具統一歸戶入口」服務，同步優化相關系統流程。',
    ],
    period: '2025/10/22 ～ 進行中',
    highlights: [
      '對齊法規與流程規範，盤點既有歸戶流程的風險節點',
      '規劃統一歸戶入口與前後台流程，降低使用者操作成本',
      '同步優化資料串接與流程驗證，提升可追蹤性與合規性',
    ],
    tags: ['法規遵循', '電子發票', '系統整合', '流程優化', '使用者體驗優化'],
  },
  {
    title: '專案名稱：子帳號及臨時工實名制',
    summary: [
      '因公司於稽核過程中被發現現場雇用外籍人士，法務單位要求全面檢視並補強供應商人員管理制度。為符合法規要求並降低營運風險，啟動子帳號及臨時工實名制專案，規劃對所有供應商服務師傅導入「實名制驗證」與「個資同意書簽署」機制，以確保人員身分合規並保障公司權益。',
    ],
    period: '2025/11/07 ～ 進行中',
    highlights: [
      '對齊法務規範與稽核要求，建立可稽核的驗證流程',
      '規劃供應商子帳號與臨時工驗證節點，提升風險控管',
      '導入個資同意書簽署機制，確保資料保護合規',
    ],
    tags: [
      '法規遵循',
      '實名制驗證',
      '個資保護',
      '風險控管',
      '供應商管理',
      '流程制度化',
      '跨部門協作',
    ],
  },
] as const satisfies readonly Experience[]

const REPORT_OTHER_PROJECTS = [
  {
    id: 'jk-pay',
    title: '街口支付串接',
    dateLabel: '02/12',
    dateRange: '2024/10/21 ～ 2025/02/12',
    highlights: [
      '串接 街口支付，提升消費者付款便利性與轉換率',
      '結合金流行銷資源，提升平台曝光與品牌觸及',
    ],
    tags: ['營運成本導向', '金流整合'],
  },
  {
    id: 'aftee-b-integration',
    title: 'AFTEE B 端串接',
    dateLabel: '03/18',
    dateRange: '2025/01/15 ～ 2025/03/18',
    highlights: [
      '串接 AFTEE B 端金流，提供企業會員更多支付選擇',
      '降低手續費率，提升平台銷售競爭力',
    ],
    tags: ['銷售導向', '金流整合'],
  },
  {
    id: 'penalty-order-transfer',
    title: '罰金訂單不拋 GOLF',
    dateLabel: '03/25',
    dateRange: '2025/03/12 ～ 2025/03/25',
    highlights: [
      '調整罰金訂單拋轉規則，確保帳務處理正確性與一致性',
      '降低內控與實務帳務落差',
    ],
    tags: ['品質導向', '帳務邏輯調整'],
  },
  {
    id: 'aftee-c-test',
    title: '金流元件測試－AFTEE C 端',
    dateLabel: '04/29',
    dateRange: '2025/04/29',
    highlights: [
      '執行 AFTEE C 端金流元件測試，確保結帳流程穩定',
      '降低交易失敗與客訴風險',
    ],
    tags: ['Bug 處理', '金流穩定性'],
  },
  {
    id: 'invoice-date-fix',
    title: '折讓單憑證日期調整',
    dateLabel: '05/07',
    dateRange: '2025/04/15 ～ 2025/05/07',
    highlights: [
      '調整折讓單憑證日期邏輯，符合電子發票上傳時限規範',
      '確保帳務資料合規與一致性',
    ],
    tags: ['法規遵循', '系統修正'],
  },
  {
    id: 'cash-on-site-order',
    title: '補單現場收取現金機制',
    dateLabel: '05/14',
    dateRange: '2025/03/26 ～ 2025/05/14',
    highlights: [
      '建立現場現金補單機制，避免交易未回報導致營收流失',
      '強化交易紀錄完整性，降低財務風險',
    ],
    tags: ['品質導向', '風險控管'],
  },
  {
    id: 'general-account-rule',
    title: '一般商品帳款規則調整',
    dateLabel: '09/10',
    dateRange: '2025/03/25 ～ 2025/09/10',
    highlights: [
      '修正一般商品帳款規則，解決報表對帳不一致問題',
      '強化內控機制，降低財務報表失真風險，支援 IPO 需求',
    ],
    tags: ['法規遵循', '帳務正確性'],
  },
  {
    id: 'subscription-price-logic',
    title: '訂閱制售價抓取邏輯調整',
    dateLabel: '10/27',
    dateRange: '2025/08/13 ～ 2025/10/27',
    highlights: [
      '優化訂閱制漲價處理流程，降低大量人工調整作業',
      '縮短調整時程並降低人為錯誤風險',
    ],
    tags: ['UX 導向', '流程自動化'],
  },
  {
    id: 'aftee-return-api',
    title: 'AFTEE 部退專用 API',
    dateLabel: '10/28',
    dateRange: '2025/10/28',
    highlights: [
      '規劃並導入部退專用 API，強化金流元件的系統穩定性',
      '降低後續串接與維護成本，提升金流模組可擴充性（AFTEE）',
    ],
    tags: ['Bug 處理', '系統整合', '金流穩定性'],
  },
  {
    id: 'return-discount-transfer',
    title: '銷折退單拋轉邏輯優化',
    dateLabel: '10/30',
    dateRange: '2025/06/09 ～ 2025/10/30',
    highlights: [
      '優化系統拋轉邏輯，確保折讓單符合「開立日起 48 小時內上傳」規範',
      '降低因法規不符產生的罰鍰與帳務風險（對齊 財政部 規範）',
    ],
    tags: ['法規遵循', '帳務正確性'],
  },
  {
    id: 'clarity-ux',
    title: 'Clarity 分析優化調整',
    dateLabel: '12/11',
    dateRange: '2025/10/31 ～ 2025/12/11',
    highlights: [
      '透過即時且明確的視覺回饋設計，解決使用者「點擊無回應」的操作疑慮',
      '提升操作確認感與使用流暢度，降低誤操作與重複點擊行為',
    ],
    tags: ['UX 導向', '使用者行為分析'],
  },
  {
    id: 'coupon-attribution-field',
    title: '新增折價券商品歸屬欄位',
    dateLabel: '進行中',
    dateRange: '2025/10/15 ～ 進行中',
    highlights: [
      '新增折價券成本歸屬欄位，使折價成本可正確分攤至實際使用商品',
      '支援 BI 進行毛利與成本分析，提升財務數據準確性',
    ],
    tags: ['營運成本導向', 'BI 數據準確性'],
  },
  {
    id: 'cash-backfill-guardrail',
    title: '現金補單防呆機制調整',
    dateLabel: '進行中',
    dateRange: '2025/10/15 ～ 進行中',
    highlights: [
      '將補單設定行為由事前設定，調整為於數位簽收單流程中引導完成',
      '有效降低供應商遺漏設定機率，減少內部人工作業與補救成本',
    ],
    tags: ['UX 導向', '流程防呆'],
  },
] as const satisfies readonly ReportOtherProject[]

const RESUME_CONTENT = {
  header: {
    title: 'Hugo',
    // subtitle: 'Data • BI • Automation',
  },
  hero: {
    title: '謝佩蓁 | Hugo',
    subtitle: '把人生當作專案管理\u00a0\u00a0以系統化的方式推進',
    paragraphs: [
      '對生活與創意充滿熱情，擅長將抽象概念分析拆解成可執行的任務。',
      '同時熱愛研究各類軟體工具，如 Notion，透過工具與方法提升專案效率。',
    ],
    primaryCta: '看作品集',
    secondaryCta: '先了解我',
  },
  about: {
    title: '關於我',
    heading: '擅長從使用者與系統的角度出發，將複雜需求轉化為可執行的產品解法',
    intro: [
      '對我而言，PM 不只是控管時程或任務，而是那個能夠串起人、流程與技術，讓想法真正被實現，並轉化為實際價值的人。我希望能在更成熟、專業的產品開發環境中持續磨練這樣的能力，拓展自己的視野，創造對使用者與組織都有意義的成果。',
    ],
    more: [
      '熱愛影像創作的我，大學選擇就讀大眾傳播學系，就學期間投入影像製作與內容企劃，學習如何將抽象想法轉化為具體畫面，並思考觀眾如何理解與接收訊息。這段訓練，讓我對「人如何與資訊互動」產生了興趣。',
      '畢業後，我曾在農場打工。當時農場尚未有訂房系統，所有流程仰賴人工處理，在實際協助營運的過程中，我開始思考是否能透過系統改善現有流程，並主動建議老闆導入訂房工具。這是我第一次實際接觸到「系統、產品與使用者」之間的關係，也讓我意識到，一個好的設計不只影響畫面，而是能真正改變工作方式與使用體驗。',
      '後來，一次偶然的機會接觸到介紹 UI/UX 職業的 podcast，這段內容替我補上了關鍵的一塊拼圖——原來我在意的，不只是創作本身，而是整體使用流程與體驗設計。這樣的好奇心，促使我開始自學 UI/UX，並逐步轉職進入產品規劃的領域。',
      '這條路徑，對我而言並非突然的轉向，而是從內容與影像出發，延伸到系統、流程與價值實現的自然演進，也形塑了我現在看待產品與問題的方式。',
    ],
    traits: [
      {
        title: '好奇探索',
        body: '勇於嘗試新事物，樂於在創新與實驗中累積經驗。',
      },
      {
        title: '理性分析',
        body: '善於運用邏輯與結構化思維，找出問題的根本原因。',
      },
      {
        title: '同理傾聽',
        body: '能感受並理解他人立場，善於傾聽並建立信任。',
      },
    ],
  },
  experience: {
    title: '經歷',
  },
  portfolio: {
    introLabel: '嗨，歡迎來到我的作品集',
    title: '你想從哪裡著手？',
    placeholder: '請選擇想看的技能',
    prompt: (label: string) => `想看「${label}」的作品嗎？`,
  },
} as const

const REPORT_CONTENT = {
  header: {
    title: '2025 年度總結報告',
    // subtitle: '回顧 • 成果 • 下一步',
  },
  hero: {
    title: '2025 年度回顧',
    subtitle: '以產品思維整理一年：成果、學習與下一步',
    paragraphs: [
      '這份報告彙整 2025 年度的專案推進、跨部門協作與數據成果。',
      '聚焦於可衡量影響、流程改善與個人成長，作為 2026 行動方向的基礎。',
    ],
    primaryCta: '看年度成果',
    secondaryCta: '讀年度摘要',
  },
  about: {
    title: '2025年度專案經驗回顧與自我精進方向',
    heading: '',
    intro: [
      '今年所參與的一般專案，主要聚焦於系統穩定性、法規遵循、帳務正確性，以及使用者操作上的防呆與體驗優化。這類專案多半並非以外顯的新功能或業績指標為導向，而是著重於維持既有系統運作的穩定度、降低營運與法遵風險，並確保帳務流程的正確性與一致性，屬於支撐整體營運的重要基礎工作。',
    ],
    more: [
      '在系統改版專案中，實際參與並完成了包含賣場建立、成本與售價設定、供應商建立，以及訂單作業流程等核心功能的規劃與推進。透過這段經驗，我逐步建立對系統流程整體架構的理解，也更能掌握不同角色（使用者、供應商、內部人員）在實際操作上的關鍵痛點與風險節點，進而在需求規劃階段，能更有意識地從使用情境、操作流程與後續維運角度進行思考與設計。',
      '回顧自 2023 年 6 月加入 HoHo 至今，已累積約兩年半的實務經驗。從一開始以執行與支援為主的網站助理角色，逐步成長到能夠獨立進行專案規劃、承接並整理需求，並實際參與重要系統改版專案的核心討論與執行，在過程中不僅累積了專案與系統面的經驗，也逐漸建立對自身角色定位與責任範圍的清楚認知。',
      '同時，我也清楚意識到，隨著專案規模與責任提升，跨部門溝通、需求說明與觀點對齊的能力仍有持續精進的空間。未來將在專案推進過程中，更加著重需求背景的說明、風險與影響的提前溝通，以及不同角色之間的協調，期望讓專案不僅能順利完成，更能在品質與穩定度上持續提升。',
    ],
    traits: [
      {
        title: '2026指標一',
        body: ' 還沒想好～',
      },
      {
        title: '2026指標二',
        body: '還沒想好～',
      },
      {
        title: '2026指標三',
        body: '還沒想好～',
      },
    ],
  },
  experience: {
    title: '專案回顧',
    summary:
      '聚焦於系統穩定性、法規遵循、帳務正確性與 UX 防呆的專案類型。',
    kpis: [
      '專案總數：17',
      '指標專案：3',
      '其餘專案：14',
    ],
  },
  portfolio: RESUME_CONTENT.portfolio,
} as const

const LOGIN_CREDENTIALS = {
  account: '02190',
  password: '02585',
} as const

const LOGIN_FAILURE_LINES = [
  '啊喔～錯誤～再試試看吧！',
  '啊啊～還是錯誤～再試一次！',
  '提示：帳號為自己的員工編號 ; 密碼為該員工的編號！',
] as const


// --------------------------------------------
// App
// --------------------------------------------

export default function App() {
  const { theme, toggle } = useThemeToggle()
  const [version] = useState<AppVersion>(() => getInitialVersion())
  const isReport = version === 'report-2025'
  const content = version === 'report-2025' ? REPORT_CONTENT : RESUME_CONTENT
  const skills = RESUME_SKILLS
  const experiences: readonly Experience[] =
    version === 'report-2025' ? REPORT_EXPERIENCES : RESUME_EXPERIENCES
  const portfolioContent = RESUME_CONTENT.portfolio

  // 大頭照（建議放在 public/，用「/檔名」引用）
  // 例：把照片放到 public/avatar.jpg，這裡就填 '/avatar.jpg'
  const aboutImgSrc = isReport ? '/年度報告封面.png' : '/IMG_1722.JPG'
  const [aboutImgOk, setAboutImgOk] = useState(true)

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const portfolioContentRef = useRef<HTMLDivElement | null>(null)
  const [isAboutExpanded, setIsAboutExpanded] = useState(false)
  const [experienceIndex, setExperienceIndex] = useState(0)
  const activeExperience = experiences[experienceIndex]
  const experienceSummary = activeExperience.summary ?? []
  const [isOtherProjectsOpen, setIsOtherProjectsOpen] = useState(false)
  const [activeOtherProjectId, setActiveOtherProjectId] = useState<string>(
    REPORT_OTHER_PROJECTS[0]?.id ?? ''
  )
  const activeOtherProject = REPORT_OTHER_PROJECTS.find(
    (project) => project.id === activeOtherProjectId
  )
  const [loginFields, setLoginFields] = useState({
    account: '',
    password: '',
  })
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(!isReport)
  const resumeExperienceNav = RESUME_EXPERIENCES.map((exp, index) => ({
    title: exp.title,
    index,
  })).filter((exp) =>
    [
      '專案名稱：系統改版',
      '專案名稱：會員載具大平台歸戶',
      '專案名稱：子帳號及臨時工實名制',
    ].includes(exp.title)
  )

  const failureMessage =
    loginAttempts === 0
      ? null
      : LOGIN_FAILURE_LINES[Math.min(loginAttempts, 3) - 1]
  const showLoginSuccess = isReport && isAuthenticated && loginAttempts === 0

  useEffect(() => {
    setSelectedSkill(null)
    setExperienceIndex(0)
    setIsOtherProjectsOpen(false)
    setActiveOtherProjectId(REPORT_OTHER_PROJECTS[0]?.id ?? '')
    setLoginFields({ account: '', password: '' })
    setLoginAttempts(0)
    setIsAuthenticated(!isReport)
  }, [version])

  useEffect(() => {
    if (!selectedSkill) return
    portfolioContentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [selectedSkill])

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isReport) return

    const isValid =
      loginFields.account.trim() === LOGIN_CREDENTIALS.account &&
      loginFields.password.trim() === LOGIN_CREDENTIALS.password

    if (isValid) {
      setIsAuthenticated(true)
      setLoginAttempts(0)
      return
    }

    setIsAuthenticated(false)
    setLoginAttempts((prev) => prev + 1)
  }

  return (
    <div
      className={cx(
        'min-h-screen bg-background',
        isReport ? 'report-cyber' : 'resume-glass'
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        跳到主要內容
      </a>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 shadow-sm shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-[140px]">
          <a href="#top" className="flex flex-col leading-tight">
            <span className="text-sm font-semibold font-sans tracking-tight">
              {content.header.title}
            </span>
            <span className="text-sm text-secondary">
              {content.header.subtitle}
            </span>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#about"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              About
            </a>
            <a
              href="#experience"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Experience
            </a>
            <a
              href="#portfolio"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Portfolio
            </a>

            <SimpleButton
              type="button"
              variant="outline"
              size="icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'}
              title={theme === 'dark' ? '淺色模式' : '深色模式'}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </SimpleButton>
          </nav>
        </div>
      </header>

      <main
        id="main"
        className={cx(
          'mx-auto max-w-[1440px] px-4 pb-16 pt-12 md:px-[140px]',
          !isReport && 'pb-20 pt-14 md:pb-24 md:pt-16'
        )}
      >
        <div
          className={cx(
            'space-y-16 md:space-y-20',
            !isReport && 'space-y-20 md:space-y-24'
          )}
        >
          {/* Hero */}
          <section id="Hero" className="relative">
            <div className="card-glass md:p-16">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.2fr_0.7fr] md:items-center">
                {isReport ? (
                  <div className="space-y-5">
                    <h1 className="text-4xl md:text-5xl font-semibold font-sans tracking-tight leading-tight">
                      2025 年度總結報告Hugo
                    </h1>
                    <div className="max-w-prose space-y-3 text-base leading-7 text-secondary md:text-[17px]">
                      <p>
                        這是一份主管交代要『認真準備』的年度報告！
                      </p>
                      <p>
                        為了表示我真的有放感情與時間進去，我幫它加了一個登入的入口！
                      </p>
                      <p>
                        如果能順利進來，代表你對他其實還算了解？ XD
                      </p>
                    </div>

                    <form
                      className="space-y-3"
                      onSubmit={handleLoginSubmit}
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-sm font-medium text-secondary">
                          帳號
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            className="mt-1 w-full rounded-2xl border border-input bg-surface/80 px-4 py-2 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                            value={loginFields.account}
                            onChange={(event) =>
                              setLoginFields((prev) => ({
                                ...prev,
                                account: event.target.value,
                              }))
                            }
                            placeholder="請輸入員邊帳號"
                          />
                        </label>
                        <label className="space-y-1 text-sm font-medium text-secondary">
                          密碼
                          <input
                            type="password"
                            autoComplete="off"
                            className="mt-1 w-full rounded-2xl border border-input bg-surface/80 px-4 py-2 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                            value={loginFields.password}
                            onChange={(event) =>
                              setLoginFields((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                            placeholder="請試著通靈密碼"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SimpleButton type="submit">
                          登入
                        </SimpleButton>
                        {showLoginSuccess && (
                          <span className="text-sm font-medium text-emerald-600">
                            登入成功，歡迎 我是你主管啦 使用者。
                          </span>
                        )}
                      </div>
                    </form>

                    <div className="space-y-2 text-sm">
                      {failureMessage && (
                        <p className="text-rose-500">{failureMessage}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h1 className="text-4xl md:text-6xl font-semibold font-sans tracking-tight leading-tight">
                      {content.hero.title}
                    </h1>
                    <h2 className="text-2xl md:text-4xl font-semibold font-sans tracking-tight text-foreground/90">
                      {content.hero.subtitle}
                    </h2>
                    <div className="max-w-prose space-y-3 text-[15px] leading-7 text-secondary">
                      {content.hero.paragraphs.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <SimpleButton
                        type="button"
                        onClick={() => {
                          document
                            .getElementById('portfolio')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        {content.hero.primaryCta}
                      </SimpleButton>
                      <SimpleButton
                        type="button"
                        variant="outline"
                        onClick={() => {
                          document
                            .getElementById('about')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        {content.hero.secondaryCta}
                      </SimpleButton>
                    </div>
                  </div>
                )}

                <div className="mx-auto w-full max-w-[420px] md:mx-0 md:w-[60%] md:max-w-none md:justify-self-end">
                  <div
                    className={cx(
                      'aspect-square overflow-hidden border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/40',
                      isReport ? 'rounded-none' : 'rounded-full'
                    )}
                  >
                    {aboutImgSrc && aboutImgOk ? (
                      <img
                        src={aboutImgSrc}
                        alt="About"
                        className="h-full w-full object-cover object-[50%_20%]"
                        onError={() => setAboutImgOk(false)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-sm text-secondary">
                          大頭照
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {(!isReport || isAuthenticated) && (
            <>
              {/* About Section */}
              <section id="about" className="scroll-mt-24 space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl md:text-4xl font-semibold font-sans tracking-tight">
                    {content.about.title}
                  </h2>
                  {/* <p className="text-sm text-muted-foreground">
                    用 3～5 句話快速說明定位、成果與你在乎的事情。
                  </p> */}
                </div>

                <div className="mx-auto max-w-4xl space-y-6">
                  <div className="space-y-4">
                    {content.about.heading && (
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight">
                        {content.about.heading}
                      </h3>
                    )}
                    <div className="space-y-3 text-base leading-7 text-secondary">
                      {content.about.intro.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-accent underline-offset-4 transition-colors hover:border-foreground/20 hover:bg-foreground/5 hover:text-accent-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-expanded={isAboutExpanded}
                        aria-controls="about-more"
                        onClick={() => setIsAboutExpanded((v) => !v)}
                      >
                        {isAboutExpanded ? '收合' : '閱讀更多'}
                        <ChevronDown
                          className={cx(
                            'h-4 w-4 transition-transform duration-300',
                            isAboutExpanded && 'rotate-180'
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      <div
                        id="about-more"
                        className={cx(
                          'grid transition-[grid-template-rows] duration-300 ease-out',
                          isAboutExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={cx(
                              'space-y-3 pt-1 transition-opacity duration-300',
                              isAboutExpanded ? 'opacity-100' : 'opacity-0'
                            )}
                          >
                            {content.about.more.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {content.about.traits.map((trait) => (
                        <div key={trait.title} className="card-muted">
                          <p className="mt-1 text-base font-medium text-foreground">
                            {trait.title}
                          </p>
                          <p className="text-sm text-secondary">
                            {trait.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

          {/* Experience Section */}
          <section id="experience" className="scroll-mt-24 space-y-10">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl md:text-4xl font-semibold font-sans tracking-tight">
                {content.experience.title}
              </h2>
              {/* <p className="text-sm text-muted-foreground">
                以「時間 → 角色 → 成果」來描述，讀者會更快理解你做了什麼。
              </p> */}
            </div>

            {isReport && (
              <div className="mx-auto max-w-4xl space-y-4 text-center">
                <p className="text-sm text-secondary">
                  {REPORT_CONTENT.experience.summary}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {REPORT_CONTENT.experience.kpis.map((kpi) => (
                    <div key={kpi} className="card-muted">
                      <p className="text-base font-semibold text-foreground">
                        {kpi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="relative mx-auto max-w-4xl">
                {experienceIndex > 0 && (
                  <SimpleButton
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -left-20 top-1/2 -translate-y-1/2 rounded-full shadow-none backdrop-blur-sm transition"
                    onClick={() =>
                      setExperienceIndex((prev) => Math.max(0, prev - 1))
                    }
                    aria-label="上一張"
                    title="上一張"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </SimpleButton>
                )}
                {experienceIndex < experiences.length - 1 && (
                  <SimpleButton
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -right-20 top-1/2 -translate-y-1/2 rounded-full shadow-none backdrop-blur-sm transition"
                    onClick={() =>
                      setExperienceIndex((prev) =>
                        Math.min(experiences.length - 1, prev + 1)
                      )
                    }
                    aria-label="下一張"
                    title="下一張"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </SimpleButton>
                )}
                <div className="card py-6">
                  <div className="flex items-start justify-between gap-4 px-6">
                    <div className="min-w-0">
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
                        {activeExperience.title}
                      </h3>
                      {activeExperience.company && (
                        <p className="mt-1 truncate text-sm font-semibold text-secondary">
                          {activeExperience.company}
                        </p>
                      )}
                      {experienceSummary.length ? (
                        <p className="mt-3 text-sm text-secondary">
                          {experienceSummary.map((line, index) => (
                            <span key={`${line}-${index}`}>
                              {line}
                              {index < experienceSummary.length - 1 && (
                                <br />
                              )}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    {activeExperience.period && (
                      <span className="shrink-0 badge-soft">
                        {activeExperience.period}
                      </span>
                    )}
                  </div>
                  {activeExperience.highlights && (
                    <div className="mt-5 flex flex-col gap-6 px-6 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 md:flex-1">
                        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-secondary">
                          {activeExperience.highlights.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>

                        {activeExperience.tags && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {activeExperience.tags.map((tag) => (
                              <span
                                key={tag}
                                className="badge-soft"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isReport && (
                <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-2">
                  {resumeExperienceNav.map((item) => (
                    <SimpleButton
                      key={item.title}
                      type="button"
                      variant={
                        experienceIndex === item.index ? 'solid' : 'outline'
                      }
                      size="default"
                      onClick={() => setExperienceIndex(item.index)}
                      className="h-9 px-3 text-sm"
                    >
                      {item.title}
                    </SimpleButton>
                  ))}
                </div>
              )}
              {isReport && (
                <div className="mx-auto mt-4 w-full max-w-4xl">
                  <div className="flex flex-col items-center gap-3">
                    <SimpleButton
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setIsOtherProjectsOpen((prev) => !prev)
                      }
                    >
                      其餘專案
                    </SimpleButton>
                    <div
                      className={cx(
                        'grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out',
                        isOtherProjectsOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-xs text-secondary">
                            <span>2025/01/01</span>
                            <div className="relative h-2 flex-1">
                              <div className="absolute inset-0 rounded-full bg-border/80" />
                              <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-surface shadow-sm" />
                              <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-surface shadow-sm" />
                            </div>
                            <span>2025/12/31</span>
                          </div>
                          <div className="relative mx-auto w-full">
                            <div className="absolute left-0 right-0 top-3 h-px bg-border/80" />
                            <div className="relative flex items-start justify-between gap-3">
                              {REPORT_OTHER_PROJECTS.map((project) => {
                                const isActive =
                                  project.id === activeOtherProjectId
                                return (
                                  <button
                                    key={project.id}
                                    type="button"
                                    onClick={() =>
                                      setActiveOtherProjectId(project.id)
                                    }
                                    title={project.title}
                                    className="flex flex-1 flex-col items-center gap-2 text-xs text-secondary transition hover:text-foreground"
                                    aria-pressed={isActive}
                                  >
                                    <span
                                      className={cx(
                                        'h-3 w-3 rounded-full border-2 transition',
                                        isActive
                                          ? 'border-emerald-500 bg-emerald-400/30'
                                          : 'border-border bg-surface'
                                      )}
                                    />
                                    <span className="text-center">
                                      {project.dateLabel}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          {activeOtherProject && (
                            <div className="rounded-2xl border border-border/70 bg-surface/60 p-4 text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {activeOtherProject.title}
                                </span>
                                <span className="text-xs text-secondary">
                                  {activeOtherProject.dateRange}
                                </span>
                              </div>
                              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-secondary">
                                {activeOtherProject.highlights.map(
                                  (highlight) => (
                                    <li key={highlight}>{highlight}</li>
                                  )
                                )}
                              </ul>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {activeOtherProject.tags.map((tag) => (
                                  <span key={tag} className="badge-soft">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Skills Selection Section */}
          <section id="portfolio" className="scroll-mt-24">
            <div className="card-glass md:p-12">
              <div className="mx-auto max-w-4xl space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm">
                      {portfolioContent.introLabel}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-semibold font-sans tracking-tight">
                    {portfolioContent.title}
                  </h2>
                </div>

                {/* Chat-like input (mock UI) */}
                <div className="rounded-[28px] border border-border bg-surface/70 px-5 py-4 shadow-sm backdrop-blur md:px-6 md:py-4">
                  <div className="flex min-h-[56px] items-center text-sm text-muted-foreground">
                    {selectedSkill
                      ? portfolioContent.prompt(
                          skills.find((s) => s.id === selectedSkill)?.label ??
                            selectedSkill
                        )
                      : portfolioContent.placeholder}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {skills.map((s) => {
                      const active = selectedSkill === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSkill(s.id)}
                          aria-pressed={active}
                          className={cx(
                            'h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            active
                              ? 'border-accent bg-accent text-accent-foreground hover:bg-accent-hover'
                              : 'border-border bg-surface/50 text-secondary hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground'
                          )}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Content */}
                <div ref={portfolioContentRef} className="scroll-mt-24">
                  {selectedSkill === '爬蟲' && <Pro360ScrapeShowcase />}
                  {selectedSkill === 'power bi' && <PowerBIDemoShowcase />}
                  {selectedSkill === 'vibecoding' && (
                  <div className="space-y-4">
                    <div className="card space-y-3">
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
                        AI 輔助程式撰寫與互動式 Demo 應用
                      </h3>
                      <p className="text-sm text-secondary">
                        在需求討論與規格溝通過程中，發現單純以文字與流程圖說明，容易造成需求方、工程與相關單位對功能理解不一致，進而增加來回溝通與修改成本。為降低認知落差並提升確認效率，主動運用 AI 工具輔助學習程式撰寫，並實際將其應用於互動式 Demo 與個人專案中。
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                        <li>
                          運用 AI
                          工具設計可預覽的互動式 Demo，將需求流程與操作邏輯以具體畫面呈現，協助需求方與工程快速對齊理解
                        </li>
                        <li>
                          有效降低文字規格溝通落差，縮短需求確認時程，減少後續修改與誤解成本
                        </li>
                        <li>
                          將學習成果延伸應用於作品集網站，使用 React
                          框架進行開發，並部署至 GitHub
                          提供實際瀏覽與展示
                        </li>
                      </ul>
                    </div>

                    <div className="card-muted">
                      <div className="mt-3 inline-block">
                        <img
                          src="/vibe%20coding.png"
                          alt="Vibe coding demo"
                          className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                        />
                      </div>
                      <p className="mt-2 text-center text-sm text-secondary">
                        互動式 Demo 介面：利用 AI 搭配 StackBlitz 線上開發環境，快速編寫可即時預覽的互動式 Demo。
                      </p>
                    </div>
                  </div>
                  )}
                  {selectedSkill === 'figma' && (
                  <div className="space-y-4">
                    <div className="card space-y-3">
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
                        Figma
                      </h3>
                      <p className="text-sm text-secondary">
                        於轉職階段自學 Figma，並將其實際應用於需求規劃與專案溝通中，透過 Wireframe 與流程圖，將抽象需求與功能邏輯轉化為可視化畫面，提升團隊對需求的理解一致性。
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                        <li>
                          製作 Wireframe 與流程圖，
                          <strong>將需求邏輯具象化呈現</strong>
                          ，協助團隊快速理解功能結構與操作流程
                        </li>
                        <li>
                          協助檢視與整理設計輸出內容，將視覺與流程成果
                          <strong>轉換為可交付的提案與需求文件</strong>
                          ，提升溝通效率與交付品質
                        </li>
                      </ul>
                    </div>

                    <div className="card-muted">
                      <div className="mt-3 inline-block">
                        <img
                          src="/Figma.png"
                          alt="Figma demo"
                          className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                        />
                      </div>
                      <p className="mt-2 text-center text-sm text-secondary">
                        Wireframe／流程圖：將需求邏輯以畫面具象化呈現。
                      </p>
                    </div>
                  </div>
                  )}
                  {selectedSkill === 'notion' && (
                  <div className="space-y-4">
                    <div className="card space-y-3">
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
                        Notion
                      </h3>
                      <p className="text-sm text-secondary">
                        長期使用 Notion 進行工作與個人管理，並持續研究各類數位工具與知識管理方法。在實際應用於團隊專案管理時，發現既有架構未將專案有效拆解為可執行任務，導致專案規模過於龐大，進度難以追蹤，執行上也不易落地。因此重新檢視現行流程，並參考
                        <a
                          href="https://raymondhouch.com/notion/para-pai/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline underline-offset-4"
                        >
                          雷蒙提出的 PAI 管理架構
                        </a>
                        ，調整為以「專案與行動優先」為核心的專案管理流程。
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                        <li>
                          重新設計現行 Notion 專案管理架構，以「專案 → 行動」作為主要結構，
                          <strong>取代以只有一個專案資料庫管理進度。</strong>
                        </li>
                        <li>
                          將專案任務明確拆解為可執行的行動項目，提升專案狀態與進度的
                          <strong>可視性與透明度。</strong>
                        </li>
                        <li>
                          協助改善專案追蹤與執行效率，使專案推進更聚焦於實際行動，而非僅止龐大的任務，無法實際拆分進行。
                        </li>
                      </ul>
                    </div>

                    <div className="card-muted">
                      <div className="mt-3 inline-block">
                        <div className="flex flex-col gap-3">
                          <div className="space-y-2">
                            <img
                              src="/Notion-issue.png"
                              alt="Notion issue demo"
                              className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                            />
                            <p className="text-center text-sm text-secondary">
                              Issue 資料庫：集中紀錄並追蹤 Bug 與處理進度，方便快速查閱與掌握狀況。
                            </p>
                          </div>
                          <div className="space-y-2">
                            <img
                              src="/Notion-project.png"
                              alt="Notion project demo"
                              className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                            />
                            <p className="text-center text-sm text-secondary">
                              Project資料庫：用於管理專案時程進度，並串接相關行動任務，追蹤專案完成度。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {selectedSkill === 'side project' && (
                  <div className="space-y-4">
                    <div className="card space-y-3">
                      <h3 className="text-xl md:text-2xl font-semibold font-sans tracking-tight text-emerald-700 dark:text-emerald-400">
                        Side project
                      </h3>
                      <p className="text-sm text-secondary">
                        於轉職階段，為補強產品規劃與使用者思維，主動規劃並執行 Side Project，透過實際發想與設計練習，將日常使用情境中的痛點轉化為具體的產品構想與功能設計，強化從問題定義到解法設計的完整思考能力。
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            作品一｜口袋旅行 App
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary">
                            <li>
                              針對旅行規劃需頻繁切換多個 App 的使用痛點，設計整合行程規劃與旅遊記帳功能的 App
                            </li>
                            <li>
                              規劃「旅伴共同編輯行程」機制，提升多人協作時的即時性與一致性，改善團體旅行規劃體驗
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            作品二｜HyRead App Redesign
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary">
                            <li>以實際使用者角度出發，重新檢視既有操作流程與功能配置</li>
                            <li>
                              針對使用體驗進行功能優化與介面重整設計，提出更貼近使用情境的改善方案
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="card-muted">
                      <div className="mt-3 inline-block">
                        <div className="flex flex-col gap-3">
                          <div className="space-y-2">
                            <img
                              src="/%E4%BD%9C%E5%93%81%E4%B8%80%E5%B0%81%E9%9D%A2.png"
                              alt="Side project cover 1"
                              className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                            />
                            <p className="text-center text-sm text-foreground">
                              作品一｜口袋旅行 App
                            </p>
                          </div>
                          <div className="space-y-2">
                            <img
                              src="/%E4%BD%9C%E5%93%81%E4%BA%8C%E5%B0%81%E9%9D%A2.png"
                              alt="Side project cover 2"
                              className="h-auto w-auto max-w-full rounded-xl border border-border/80 object-contain"
                            />
                            <p className="text-center text-sm text-foreground">
                              作品二｜HyRead App Redesign
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/*
              Manual test checklist
              1) 初始進入為「對話輸入框」樣式，未選技能不顯示內容。
              2) 點擊下方技能按鈕可切換內容。
              3) 選擇「爬蟲」時：
                 - Run log 為動態逐行輸出。
                 - Run log 完成後才出現「爬取結果」。
                 - 不再顯示「輸出檔案」。
              4) 選擇「power bi」時：
                 - 不顯示 Run log。
                 - 成果摘要顯示 GIF（若 public/01.gif 存在）。
                 - 右側有三張說明卡片。
            */}
          </section>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-10 text-center md:px-[140px]">
          <p className="text-sm text-secondary">
            © {new Date().getFullYear()} • Portfolio
          </p>
        </div>
      </footer>
    </div>
  )
}
