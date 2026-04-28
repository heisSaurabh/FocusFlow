import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi, taskApi } from '../api/api'
import { useAuthStore } from '../store/authStore'
import ShinyButton from '../components/ShinyButton'
import './DashboardPage.css'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [score, setScore] = useState(null)
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            analyticsApi.getScore(),
            taskApi.getAll()
        ]).then(([s, t]) => {
            setScore(s.data)
            setTasks(t.data?.slice(0, 3) || [])
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="page" style={{ paddingTop: 100 }}><div className="skeleton" style={{ height: 400, borderRadius: 24 }} /></div>

    const tickerText = `SCORE: ${score?.productivityScore || 0} // TASKS DONE: ${score?.tasksCompleted || 0} // FOCUS: ${score?.focusMinutes || 0}min // STATUS: ONLINE // `

    return (
        <div className="synapse-dashboard">
            {/* HERO SECTION */}
            <section className="hero-section">
                <div className="stagger-enter delay-1">
                    <h1 className="hero-title font-serif">
                        Your day, <br />
                        <span className="text-shimmer">optimized</span>
                    </h1>
                </div>
                <div className="stagger-enter delay-2 hero-sub">
                    <p>Welcome back, {user?.name?.split(' ')[0]}. Let's make today count.</p>
                </div>
                <div className="stagger-enter delay-3 hero-cta">
                    <Link to="/tasks"><ShinyButton>View Tasks</ShinyButton></Link>
                </div>
            </section>

            {/* METRICS TICKER */}
            <div className="ticker-wrapper stagger-enter delay-4">
                <div className="ticker-track">
                    <span className="mono">{tickerText.repeat(5)}</span>
                </div>
            </div>

            {/* FEATURE GRID */}
            <section className="dashboard-grid stagger-enter delay-4" style={{ animationDelay: '0.6s' }}>
                <div className="glass-card feature-card">
                    <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>⚡</div>
                    <h3 className="font-serif">Recent Tasks</h3>
                    <p>You have {tasks.length} tasks in your queue.</p>
                    <div className="recent-tasks-list">
                        {tasks.map((t, i) => (
                            <div key={i} className="mini-task-item">
                                <span className={`priority-indicator priority-${t.priority}`} />
                                <span className="mono">{t.title}</span>
                            </div>
                        ))}
                        {tasks.length === 0 && <span className="text-secondary" style={{ fontSize: '0.8rem' }}>No active tasks.</span>}
                    </div>
                </div>

                <div className="glass-card feature-card">
                    <div className="feature-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>⏱</div>
                    <h3 className="font-serif">Focus Timer</h3>
                    <p>Start a Pomodoro session to maximize your deep work time.</p>
                    <Link to="/pomodoro" className="naked-link mono" style={{ color: '#06b6d4' }}>START SESSION →</Link>
                </div>

                <div className="glass-card feature-card">
                    <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🧠</div>
                    <h3 className="font-serif">AI Coach</h3>
                    <p>Get smart scheduling suggestions and productivity insights from your data.</p>
                    <Link to="/ai" className="naked-link mono" style={{ color: '#10b981' }}>OPEN COACH →</Link>
                </div>
            </section>

            {/* CODE BLOCK */}
            <section className="dashboard-code-section stagger-enter" style={{ animationDelay: '0.8s' }}>
                <div className="code-window">
                    <div className="code-header">
                        <div className="window-controls">
                            <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
                        </div>
                        <span className="mono" style={{ color: 'var(--text-muted)' }}>productivity_engine.py</span>
                    </div>
                    <pre className="mono code-content">
<span style={{color: 'var(--accent-violet)'}}>import</span> focusflow{'\n'}
{'\n'}
<span style={{color: 'var(--text-muted)'}}>{"# Analyzing current performance"}</span>{'\n'}
<span style={{color: 'var(--accent-violet)'}}>def</span> <span style={{color: 'var(--accent-cyan)'}}>check_balance</span>(score):{'\n'}
    <span style={{color: 'var(--accent-violet)'}}>if</span> score {'<'} 50:{'\n'}
        <span style={{color: 'var(--accent-violet)'}}>return</span> <span style={{color: 'var(--accent-emerald)'}}>"Time for a break. Rest is productive too."</span>{'\n'}
    <span style={{color: 'var(--accent-violet)'}}>return</span> <span style={{color: 'var(--accent-emerald)'}}>"You're on a roll. Keep going!"</span>{'\n'}
{'\n'}
<span style={{color: 'var(--accent-emerald)'}}>{">> SYSTEM READY"}</span>
                    </pre>
                </div>
            </section>
        </div>
    )
}
