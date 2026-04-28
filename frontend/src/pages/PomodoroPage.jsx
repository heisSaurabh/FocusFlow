import { useState, useEffect, useRef, useCallback } from 'react'
import { pomodoroApi, taskApi } from '../api/api'
import toast from 'react-hot-toast'
import { MdTimer, MdMusicNote } from 'react-icons/md'
import CustomSelect from '../components/CustomSelect'
import { useWorkspaceStore } from '../store/workspaceStore'
import './PomodoroPage.css'

const SESSION_COLORS = { WORK: '#6366f1', SHORT_BREAK: '#22c55e', LONG_BREAK: '#0ea5e9' }
const SESSION_LABELS = { WORK: 'Focus Session', SHORT_BREAK: 'Short Break', LONG_BREAK: 'Long Break' }
const BREAK_TYPES = ['SHORT_BREAK', 'LONG_BREAK']

// Web Audio tick sound
function playTick(ctx, freq = 880) {
    try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.13)
    } catch { /* Suppress AudioContext initialization errors */ }
}

function playBreakEnd(ctx) {
    // 5 descending ticks then a chime
    [0, 250, 500, 750, 1000].forEach((ms, i) => {
        setTimeout(() => playTick(ctx, 880 - i * 60), ms)
    })
    setTimeout(() => {
        [0, 120, 240].forEach(ms => setTimeout(() => playTick(ctx, 1200), ms))
    }, 1200)
}

export default function PomodoroPage() {
    const [config, setConfig] = useState({ workDurationMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 })
    const [sessionType, setSessionType] = useState('WORK')
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [running, setRunning] = useState(false)
    const [tasks, setTasks] = useState([])
    const [selectedTask, setSelectedTask] = useState('')
    const [sessions, setSessions] = useState([])
    const [spotifyUrl, setSpotifyUrl] = useState('')
    const [spotifyInput, setSpotifyInput] = useState('')
    const [activeTab, setActiveTab] = useState('timer') // 'timer' | 'music'
    const { activeWorkspace } = useWorkspaceStore()
    const intervalRef = useRef(null)
    const audioCtxRef = useRef(null)

    const getAudioCtx = () => {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
        return audioCtxRef.current
    }

    const getTotalSeconds = useCallback((type) => {
        if (type === 'WORK') return config.workDurationMinutes * 60
        if (type === 'SHORT_BREAK') return config.shortBreakMinutes * 60
        return config.longBreakMinutes * 60
    }, [config.workDurationMinutes, config.shortBreakMinutes, config.longBreakMinutes])

    const fetchTasks = useCallback(async () => {
        try {
            const t = await taskApi.getAll(activeWorkspace?.id)
            setTasks(t.data?.filter(t => t.status !== 'COMPLETED') || [])
        } catch (e) {
            console.error('Failed to fetch tasks', e)
        }
    }, [activeWorkspace?.id])

    useEffect(() => {
        Promise.all([pomodoroApi.getConfig(), pomodoroApi.getAll()])
            .then(([c, s]) => {
                setConfig(c.data)
                setTimeLeft(c.data.workDurationMinutes * 60)
                setSessions(s.data?.slice(0, 10) || [])
            })
        fetchTasks()
    }, [fetchTasks])

    const startTimer = useCallback(async () => {
        try {
            const taskId = selectedTask || null
            const res = await pomodoroApi.start(taskId, sessionType)
            setRunning(true)
            const total = getTotalSeconds(sessionType)
            setTimeLeft(total)
            const isBreak = BREAK_TYPES.includes(sessionType)

            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    // Tick-tock countdown during last 5 seconds of a break
                    if (isBreak && t <= 5 && t > 0) {
                        playTick(getAudioCtx(), 880)
                    }
                    if (t <= 1) {
                        clearInterval(intervalRef.current)
                        setRunning(false)
                        toast.success(`${SESSION_LABELS[sessionType]} complete!`)
                        if (isBreak) playBreakEnd(getAudioCtx())
                        if (res.data?.id) {
                            pomodoroApi.complete(res.data.id).then(() =>
                                pomodoroApi.getAll().then(r => setSessions(r.data?.slice(0, 10) || []))
                            )
                        }
                        return 0
                    }
                    return t - 1
                })
            }, 1000)
        } catch { toast.error('Failed to start session') }
    }, [sessionType, selectedTask, getTotalSeconds])

    const stopTimer = () => {
        clearInterval(intervalRef.current)
        setRunning(false)
        setTimeLeft(getTotalSeconds(sessionType))
    }

    const switchType = (type) => {
        if (running) { clearInterval(intervalRef.current); setRunning(false) }
        setSessionType(type)
        setTimeLeft(getTotalSeconds(type))
    }

    useEffect(() => () => clearInterval(intervalRef.current), [])

    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const secs = String(timeLeft % 60).padStart(2, '0')
    const total = getTotalSeconds(sessionType)
    const progress = ((total - timeLeft) / total) * 100
    const color = SESSION_COLORS[sessionType]
    const completedToday = sessions.filter(s => s.isCompleted && s.sessionType === 'WORK').length

    // Spotify embed URL converter
    const handleSpotifyLoad = () => {
        const url = spotifyInput.trim()
        if (!url) return
        // Convert Spotify URLs → embed URLs
        // https://open.spotify.com/playlist/xxx → https://open.spotify.com/embed/playlist/xxx
        const converted = url.replace('open.spotify.com/', 'open.spotify.com/embed/')
        setSpotifyUrl(converted)
    }

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>Pomodoro Timer</h1>
                    <p>Stay focused with timed work sessions</p>
                </div>
                <div className="badge badge-success">{completedToday} sessions today</div>
            </div>

            {/* Tab switcher */}
            <div className="pomodoro-tabs">
                {[['timer', 'Timer'], ['music', 'Music']].map(([key, label]) => (
                    <button key={key} className={`pomodoro-tab-btn ${activeTab === key ? 'active' : ''}`}
                        onClick={() => setActiveTab(key)}>{label}</button>
                ))}
            </div>

            {activeTab === 'timer' && (
                <div className="pomodoro-layout">
                    {/* Timer */}
                    <div className="glass-card pomodoro-card">
                        {/* Session type switcher */}
                        <div className="session-tabs">
                            {Object.entries(SESSION_LABELS).map(([type, label]) => (
                                <button key={type} className={`session-tab ${sessionType === type ? 'active' : ''}`}
                                    style={sessionType === type ? { background: SESSION_COLORS[type] + '33', color: SESSION_COLORS[type], borderColor: SESSION_COLORS[type] + '55' } : {}}
                                    onClick={() => switchType(type)} disabled={running}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Circular Progress */}
                        <div className="timer-circle-wrap">
                            <svg className="timer-svg" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                                <circle cx="100" cy="100" r="90" fill="none"
                                    stroke={color} strokeWidth="10"
                                    strokeDasharray={`${2 * Math.PI * 90}`}
                                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 100 100)"
                                    style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
                                />
                            </svg>
                            <div className="timer-display" style={{ color }}>
                                <span className="timer-time">{mins}:{secs}</span>
                                <span className="timer-label">{SESSION_LABELS[sessionType]}</span>
                                {BREAK_TYPES.includes(sessionType) && running && timeLeft <= 5 && (
                                    <span className="tick-countdown" style={{ color }}>{timeLeft}</span>
                                )}
                            </div>
                        </div>

                        {/* Task selector */}
                        <CustomSelect 
                            label="Link to Task (optional)"
                            value={selectedTask}
                            onChange={val => setSelectedTask(val)}
                            onOpen={fetchTasks}
                            disabled={running}
                            placeholder="No task selected"
                            options={[
                                { value: '', label: 'No task selected' },
                                ...tasks.map(t => ({ value: t.id, label: t.title }))
                            ]}
                            className="pomodoro-task-select"
                        />

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            {!running
                                ? <button className="btn btn-primary btn-lg" onClick={startTimer} style={{ background: color, boxShadow: `0 4px 15px ${color}55` }}>
                                    ▶ Start {SESSION_LABELS[sessionType]}
                                </button>
                                : <button className="btn btn-danger btn-lg" onClick={stopTimer}>⏹ Stop</button>
                            }
                        </div>
                    </div>

                    {/* History */}
                    <div>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>Recent Sessions</h3>
                            {sessions.length === 0
                                ? <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-icon"><MdTimer /></div><p>No sessions yet</p></div>
                                : sessions.map((s, i) => (
                                    <div key={i} className="session-row">
                                        <div className="session-dot" style={{ background: SESSION_COLORS[s.sessionType] || '#6366f1' }} />
                                        <div className="session-body">
                                            <span className="session-type">{SESSION_LABELS[s.sessionType] || s.sessionType}</span>
                                            <span className="session-duration">{s.durationMinutes} min</span>
                                        </div>
                                        <div className={`badge ${s.isCompleted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                            {s.isCompleted ? '✓ Done' : 'Stopped'}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="glass-card" style={{ padding: 24, marginTop: 16 }}>
                            <h4 style={{ marginBottom: 12 }}>Pomodoro Tips</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {['Work for 25 min without distractions',
                                    'Take a 5-min break to rest your eyes',
                                    'After 4 sessions, take a 15-min break',
                                    'Use breaks to stretch & hydrate',
                                    'Silence notifications during focus time'
                                ].map((tip, i) => (
                                    <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--primary-light)', flexShrink: 0 }}>•</span>{tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'music' && (
                <div className="glass-card" style={{ padding: 28, maxWidth: 700 }}>
                    <h3 style={{ marginBottom: 6 }}>Focus Music</h3>
                    <p style={{ marginBottom: 20, fontSize: '0.85rem' }}>Paste a Spotify playlist, album, or track URL to embed it here.</p>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <input className="input" placeholder="https://open.spotify.com/playlist/..."
                            value={spotifyInput} onChange={e => setSpotifyInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSpotifyLoad()}
                        />
                        <button className="btn btn-primary" onClick={handleSpotifyLoad}>Load</button>
                    </div>

                    {spotifyUrl ? (
                        <iframe
                            src={spotifyUrl}
                            width="100%"
                            height="380"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ borderRadius: 16 }}
                        />
                    ) : (
                        <div className="empty-state" style={{ padding: 48, border: '1px dashed var(--border)', borderRadius: 12 }}>
                            <div style={{ fontSize: '3rem' }}><MdMusicNote /></div>
                            <p>Paste a Spotify URL above to start listening</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Works with playlists, albums, and tracks</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
