'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, BookOpen, GraduationCap, Award, TrendingUp, DollarSign,
  RefreshCw,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '@/store/auth'
import { adminStatsApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { StatsSummary, EnrollmentTrend, RevenueTrend, TopCourse, SemesterStat, StatsPeriod } from '@/types/stats'

const PERIOD_OPTIONS: { label: string; value: StatsPeriod }[] = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

const TERM_LABEL: Record<string, string> = { spring: '1학기', summer: '여름', fall: '2학기', winter: '겨울' }
const COURSE_TYPE_LABEL: Record<string, string> = { certificate: '자격증', credit_bank: '학점은행' }

function formatAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDate(date: string, period: StatsPeriod) {
  const d = new Date(date)
  if (period === 7) return `${d.getMonth() + 1}/${d.getDate()}`
  if (period === 30) return `${d.getMonth() + 1}/${d.getDate()}`
  return `${d.getMonth() + 1}월`
}

function LoadingRow() {
  return <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
}

export default function AdminDashboard() {
  const { token } = useAuthStore()
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [enrollTrend, setEnrollTrend] = useState<EnrollmentTrend[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([])
  const [topCourses, setTopCourses] = useState<TopCourse[]>([])
  const [semesterStats, setSemesterStats] = useState<SemesterStat[]>([])
  const [period, setPeriod] = useState<StatsPeriod>(30)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [loadingTables, setLoadingTables] = useState(true)

  const loadSummary = useCallback(async (tkn: string) => {
    setLoadingSummary(true)
    try { setSummary(await adminStatsApi.summary(tkn)) } catch { /* silent */ }
    finally { setLoadingSummary(false) }
  }, [])

  const loadTrend = useCallback(async (tkn: string, p: StatsPeriod) => {
    setLoadingTrend(true)
    try {
      const [enroll, revenue] = await Promise.all([
        adminStatsApi.enrollments(tkn, p),
        adminStatsApi.revenue(tkn, p),
      ])
      setEnrollTrend(enroll)
      setRevenueTrend(revenue)
    } catch { /* silent */ }
    finally { setLoadingTrend(false) }
  }, [])

  const loadTables = useCallback(async (tkn: string) => {
    setLoadingTables(true)
    try {
      const [top, sems] = await Promise.all([
        adminStatsApi.topCourses(tkn),
        adminStatsApi.semesters(tkn),
      ])
      setTopCourses(top)
      setSemesterStats(sems)
    } catch { /* silent */ }
    finally { setLoadingTables(false) }
  }, [])

  useEffect(() => {
    if (!token) return
    loadSummary(token)
    loadTables(token)
  }, [token, loadSummary, loadTables])

  useEffect(() => {
    if (!token) return
    loadTrend(token, period)
  }, [token, period, loadTrend])

  const handleRefresh = () => {
    if (!token) return
    loadSummary(token)
    loadTrend(token, period)
    loadTables(token)
  }

  const fmt = (n: number | undefined) =>
    n === undefined ? '—' : n.toLocaleString()

  // 90일 mode: 월별로 집계해서 표시
  const trendEnrollData = period === 90
    ? Object.values(
        enrollTrend.reduce<Record<string, { date: string; count: number }>>((acc, row) => {
          const m = row.date.slice(0, 7)
          acc[m] = { date: m, count: (acc[m]?.count ?? 0) + row.count }
          return acc
        }, {}),
      )
    : enrollTrend

  const trendRevenueData = period === 90
    ? Object.values(
        revenueTrend.reduce<Record<string, { date: string; total: number }>>((acc, row) => {
          const m = row.date.slice(0, 7)
          acc[m] = { date: m, total: (acc[m]?.total ?? 0) + row.total }
          return acc
        }, {}),
      )
    : revenueTrend

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="zslab LMS 관리자 현황"
        actions={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 새로고침
          </button>
        }
      />

      <div className="p-6 space-y-6">

        {/* ── KPI 카드 6개 ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="전체 회원"
            value={loadingSummary ? '—' : fmt(summary?.total_users)}
            icon={Users}
            description="등록된 전체 회원"
          />
          <StatCard
            title="오늘 가입"
            value={loadingSummary ? '—' : fmt(summary?.today_users)}
            icon={TrendingUp}
            description="오늘 신규 가입자"
          />
          <StatCard
            title="수강신청"
            value={loadingSummary ? '—' : fmt(summary?.total_enrollments)}
            icon={BookOpen}
            description="활성 수강신청 수"
          />
          <StatCard
            title="완료율"
            value={loadingSummary ? '—' : `${summary?.completion_rate ?? 0}%`}
            icon={GraduationCap}
            description="수강 완료율"
          />
          <StatCard
            title="전체 매출"
            value={loadingSummary ? '—' : `₩${formatAmount(summary?.total_revenue ?? 0)}`}
            icon={DollarSign}
            description="결제 완료 합계"
          />
          <StatCard
            title="발급 자격증"
            value={loadingSummary ? '—' : fmt(summary?.total_certificates)}
            icon={Award}
            description="활성 자격증 발급 수"
          />
        </div>

        {/* ── 추이 차트 + period 탭 ─────────────────── */}
        <div className="rounded-lg border border-border/60 bg-card">
          {/* 헤더 + period 탭 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold">추이 차트</h2>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    period === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
            {/* 수강신청 라인차트 */}
            <div className="p-5">
              <p className="text-xs text-muted-foreground mb-4">일별 수강신청 수</p>
              {loadingTrend ? (
                <LoadingRow />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendEnrollData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatDate(v, period)}
                      interval={period === 7 ? 0 : period === 30 ? 4 : 0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="수강신청"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 매출 바차트 */}
            <div className="p-5">
              <p className="text-xs text-muted-foreground mb-4">일별 매출 (원)</p>
              {loadingTrend ? (
                <LoadingRow />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendRevenueData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatDate(v, period)}
                      interval={period === 7 ? 0 : period === 30 ? 4 : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatAmount(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(v) => [`₩${Number(v).toLocaleString()}`, '매출']}
                    />
                    <Bar dataKey="total" name="매출" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── 하단 테이블 영역 ──────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* 인기 강좌 TOP 10 */}
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold">인기 강좌 TOP 10</h2>
              <p className="text-xs text-muted-foreground mt-0.5">활성 수강자 수 기준</p>
            </div>
            {loadingTables ? (
              <LoadingRow />
            ) : topCourses.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">데이터 없음</div>
            ) : (
              <div className="divide-y divide-border/60">
                {topCourses.map((course, idx) => (
                  <div key={course.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <span className={`shrink-0 w-6 text-center text-xs font-bold ${
                      idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{course.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {course.category_name ?? '—'} · {COURSE_TYPE_LABEL[course.course_type] ?? course.course_type}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{course.enrollment_count.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">수강자</p>
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 학기별 현황 */}
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold">학기별 수강 현황</h2>
              <p className="text-xs text-muted-foreground mt-0.5">학점은행제 학기 통계</p>
            </div>
            {loadingTables ? (
              <LoadingRow />
            ) : semesterStats.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">데이터 없음</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">학기</th>
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">상태</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">분반</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">수강</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">완료</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {semesterStats.map((sem) => (
                      <tr key={sem.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {sem.year}년 {TERM_LABEL[sem.term] ?? sem.term}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge status={sem.status} />
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{sem.offering_count}</td>
                        <td className="px-3 py-3 text-right font-medium">{sem.enrollment_count}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={sem.completed_count > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                            {sem.completed_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
