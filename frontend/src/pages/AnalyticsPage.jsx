import { useState, useEffect, useRef } from 'react'
import { analyticsApi } from '../api/api'
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import './AnalyticsPage.css'

const CAT_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#f59e0b', '#ec4899', '#94a3b8']

const TOOLTIP = {
    contentStyle: {
        background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: '0.82rem'
    },
    cursor: { fill: 'rgba(139,92,246,0.05)' }
}

export default function AnalyticsPage() {
    const [score, setScore] = useState(null)
    const [weekly, setWeekly] = useState([])
    const [categories, setCategories] = useState([])
    const [pomodoro, setPomodoro] = useState(null)
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const chartRef = useRef(null)

    useEffect(() => {
        Promise.all([
            analyticsApi.getScore(),
            analyticsApi.getWeekly(),
            analyticsApi.getCategories(),
            analyticsApi.getPomodoro(),
            analyticsApi.getReport(),
        ]).then(([s, w, c, p, r]) => {
            setScore(s.data); setWeekly(w.data); setCategories(c.data || [])
            setPomodoro(p.data); setReport(r.data)
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.getEchartsInstance().resize()
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleDownloadPdf = async () => {
        try {
            const res = await analyticsApi.getPdfReport()
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = Object.assign(document.createElement('a'), { href: url, download: 'FocusFlow_Report.pdf' })
            document.body.appendChild(a); a.click(); a.remove()
        } catch (e) { console.error(e) }
    }

    const getHeatmapData = () => {
        const data = []
        const date = new Date()
        date.setMonth(date.getMonth() - 6)
        const now = new Date()
        while (date <= now) {
            const dayStr = echarts.format.formatTime('yyyy-MM-dd', date)
            const val = Math.floor(Math.random() * 5)
            data.push([dayStr, val])
            date.setDate(date.getDate() + 1)
        }
        return data
    }

    const heatmapOption = {
        tooltip: { position: 'top' },
        visualMap: {
            min: 0, max: 4, type: 'piecewise', orient: 'horizontal', left: 'center', bottom: 10,
            pieces: [
                { value: 0, color: 'rgba(255,255,255,0.02)', label: 'None' },
                { value: 1, color: '#4c1d95', label: 'Low' },
                { value: 2, color: '#7c3aed', label: 'Medium' },
                { value: 3, color: '#8b5cf6', label: 'High' },
                { value: 4, color: '#a78bfa', label: 'Ultra' },
            ],
            textStyle: { color: '#666', fontSize: 10 }
        },
        calendar: {
            top: 40, left: 30, right: 30, cellSize: ['auto', 13],
            range: [echarts.format.formatTime('yyyy-MM-dd', new Date(new Date().setMonth(new Date().getMonth() - 5))), echarts.format.formatTime('yyyy-MM-dd', new Date())],
            itemStyle: { borderWidth: 2, borderColor: '#0d0d0f' },
            splitLine: { show: false },
            yearLabel: { show: false },
            dayLabel: { color: '#666', fontSize: 10, nameMap: 'en' },
            monthLabel: { color: '#666', fontSize: 10, nameMap: 'en' }
        },
        series: {
            type: 'scatter', coordinateSystem: 'calendar', symbolSize: 1,
            data: getHeatmapData(),
            itemStyle: { color: 'transparent' },
            renderItem: (params, api) => {
                const coords = api.coord(params.value(0))
                const val = params.value(1)
                const colorMap = ['rgba(255,255,255,0.05)', '#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']
                return {
                    type: 'rect',
                    shape: { x: coords[0] - 6, y: coords[1] - 6, width: 12, height: 12 },
                    style: { fill: colorMap[val] || colorMap[0], radius: 2 }
                }
            }
        }
    }

    const completionPct = parseFloat(score?.completionRate || '0')
    const focusPct = Math.min(100, ((pomodoro?.focusMinutes || 0) / (7 * 4 * 25)) * 100)
    const onTimePct = score?.overdueCount === 0 ? 100 : Math.max(0, 100 - (score?.overdueCount || 0) * 10)

    if (loading) return <div className="page"><div className="skeleton" style={{ height: 600 }} /></div>

    return (
        <div className="page analytics-page fade-in">
            <div className="page-header">
                <div>
                    <h1 className="font-serif">Analytics</h1>
                    <p>Performance trends & Productivity patterns</p>
                </div>
                <button className="btn btn-secondary" onClick={handleDownloadPdf}>↓ PDF Report</button>
            </div>

            {/* KPI Row */}
            <div className="analytics-kpi-grid">
                <div className="kpi-box">
                    <div className="kpi-score" style={{ color: '#8b5cf6' }}>{score?.productivityScore ?? '--'}</div>
                    <div className="kpi-label">Productivity Score</div>
                </div>
                <div className="kpi-box">
                    <div className="kpi-score" style={{ color: '#a78bfa' }}>{score?.tasksCompleted ?? 0}</div>
                    <div className="kpi-label">Tasks Done</div>
                </div>
                <div className="kpi-box">
                    <div className="kpi-score" style={{ color: '#06b6d4' }}>{pomodoro?.focusHours ?? 0}h</div>
                    <div className="kpi-label">Focus Time</div>
                </div>
                <div className="kpi-box">
                    <div className="kpi-score" style={{ color: '#10b981' }}>{onTimePct.toFixed(0)}%</div>
                    <div className="kpi-label">Efficiency</div>
                </div>
            </div>

            {/* Heatmap Row */}
            <div className="glass-card" style={{ marginBottom: 24, padding: '24px 10px' }}>
                <h3 style={{ paddingLeft: 14, marginBottom: 0, fontSize: '1rem' }}>Productivity Heatmap</h3>
                <ReactECharts ref={chartRef} option={heatmapOption} style={{ height: 200 }} />
            </div>

            {/* Charts Grid */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Weekly Overview</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weekly} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip {...TOOLTIP} />
                            <Bar dataKey="completed" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Category Mix</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <ResponsiveContainer width={140} height={140}>
                            <PieChart>
                                <Pie data={categories} dataKey="hours" nameKey="category" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                                    {categories.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                                </Pie>
                                <Tooltip {...TOOLTIP} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {categories.slice(0, 4).map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{c.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Report */}
            {report && (
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem' }}>Executive Summary</h3>
                        <span className="badge badge-primary">{report.tier?.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                        <div className="report-box">
                            <div className="report-box-label">Productivity Score</div>
                            <div className="report-box-value" style={{ color: '#a78bfa' }}>{report.productivityScore?.productivityScore}</div>
                        </div>
                        <div className="report-box">
                            <div className="report-box-label">Tasks (7d)</div>
                            <div className="report-box-value" style={{ color: '#34d399' }}>{report.productivityScore?.tasksCompleted}</div>
                        </div>
                        <div className="report-box">
                            <div className="report-box-label">Focus Hours</div>
                            <div className="report-box-value" style={{ color: '#22d3ee' }}>{report.pomodoroStats?.focusHours}h</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
