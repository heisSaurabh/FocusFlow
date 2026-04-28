import { useState, useEffect, useRef } from 'react'
import { aiApi, taskApi } from '../api/api'
import { useWorkspaceStore } from '../store/workspaceStore'
import toast from 'react-hot-toast'
import {
    MdSend, MdAutoAwesome, MdSchedule, MdTimeline,
    MdPsychology, MdLightbulb, MdSmartToy, MdPerson,
    MdStar, MdRefresh, MdAddTask, MdClose,
    MdWifi, MdWifiOff, MdCircle, MdThumbDown, MdGridView
} from 'react-icons/md'
import './AiPage.css'

// ── NLP task confirmation card shown inside chat ───────────────────────────
function NlpCard({ parsed, onConfirm, onDismiss }) {
    const PRIORITY_COLORS = { URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' }
    const pc = PRIORITY_COLORS[parsed.priority] || '#6366f1'
    return (
        <div className="nlp-card">
            <div className="nlp-card-header">
                <MdAutoAwesome className="nlp-card-icon" />
                <span>Task detected — review &amp; confirm</span>
            </div>
            <div className="nlp-card-fields">
                {[
                    ['Title',    parsed.title],
                    ['Date',     parsed.date],
                    ['Time',     parsed.startTime ? `${parsed.startTime} – ${parsed.endTime}` : 'Not specified'],
                    ['Category', parsed.category],
                    ['Priority', parsed.priority],
                ].map(([k, v]) => v && (
                    <div key={k} className="nlp-card-field">
                        <span className="nlp-card-key">{k}</span>
                        <span className="nlp-card-val"
                            style={k === 'Priority' ? { color: pc, fontWeight: 700 } : {}}>
                            {v}
                        </span>
                    </div>
                ))}
            </div>
            <div className="nlp-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => onDismiss('NOT_A_TASK', parsed.originalInput)}>
                    <MdThumbDown /> Wrong
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => onDismiss('CANCELLED', parsed.originalInput)}>
                    <MdClose /> Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => onConfirm(parsed)}>
                    <MdAddTask /> Create Task
                </button>
            </div>
        </div>
    )
}

// ── AI Engine status pill ──────────────────────────────────────────────────
function AiStatusPill({ status }) {
    if (!status) return null
    const isBrain = status.engine === 'FOCUSFLOW_BRAIN'
    return (
        <div className={`ai-status-pill ${isBrain ? 'gemini' : 'local'}`}>
            {isBrain
                ? <><MdPsychology /> FocusFlow Brain Active</>
                : <><MdCircle style={{ fontSize: '0.6rem' }} /> Rule-Based Mode</>
            }
        </div>
    )
}

export default function AiPage() {
    const { activeWorkspace } = useWorkspaceStore()
    const [chatMessages, setChatMessages] = useState([
        {
            role: 'ai',
            type: 'CHAT',
            text: "Hey! I'm your local FocusFlow assistant. Everything we discuss stays right here on your machine.\n\nNeed help crushing procrastination, prioritizing your day, or want me to instantly schedule a task like **\"Study math at 5 PM tomorrow\"**? Just let me know! ✨"
        }
    ])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [schedule, setSchedule] = useState([])
    const [prioritized, setPrioritized] = useState([])
    const [insights, setInsights] = useState([])
    const [activeTab, setActiveTab] = useState('chat')
    const [aiStatus, setAiStatus] = useState(null)
    const [decomposeInput, setDecomposeInput] = useState('')
    const [decomposedTasks, setDecomposedTasks] = useState([])
    const [decomposeLoading, setDecomposeLoading] = useState(false)
    const chatEndRef = useRef(null)

    const handleDecompose = async () => {
        if (!decomposeInput.trim()) return
        setDecomposeLoading(true)
        try {
            const res = await aiApi.decomposeTask(decomposeInput.trim())
            setDecomposedTasks(res.data)
            toast.success("Task decomposed successfully!")
        } catch {
            toast.error("Failed to decompose task. Check if local AI is running.")
        } finally {
            setDecomposeLoading(false)
        }
    }

    const TABS = [
        { id: 'chat',       icon: <MdPsychology />,  label: 'AI Chat' },
        { id: 'schedule',   icon: <MdSchedule />,    label: 'Smart Schedule' },
        { id: 'prioritize', icon: <MdTimeline />,    label: 'Prioritize Tasks' },
        { id: 'decompose',  icon: <MdGridView />,    label: 'Smart Decomposer' },
        { id: 'insights',   icon: <MdLightbulb />,   label: 'Insights' },
    ]

    // auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages, chatLoading])

    // Load AI status on mount
    useEffect(() => {
        aiApi.getStatus().then(r => setAiStatus(r.data)).catch(() => {})
    }, [])

    useEffect(() => {
        if (activeTab === 'schedule' && schedule.length === 0) loadSchedule()
        if (activeTab === 'prioritize' && prioritized.length === 0) loadPrioritize()
        if (activeTab === 'insights' && insights.length === 0) loadInsights()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const sendChat = async () => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatInput('')
        setChatMessages(m => [...m, { role: 'user', type: 'CHAT', text: userMsg }])
        setChatLoading(true)
        try {
            const res = await aiApi.chatNlp(userMsg)
            const data = res.data
            if (data.type === 'NLP') {
                setChatMessages(m => [...m, {
                    role: 'ai',
                    type: 'NLP',
                    text: data.response,
                    parsed: data.parsed,
                }])
            } else {
                setChatMessages(m => [...m, {
                    role: 'ai',
                    type: 'CHAT',
                    text: data.response,
                }])
                // refresh ai status (engine may have changed)
                aiApi.getStatus().then(r => setAiStatus(r.data)).catch(() => {})
            }
        } catch {
            setChatMessages(m => [...m, {
                role: 'ai',
                type: 'CHAT',
                text: "Sorry, I couldn't respond right now. Please check your connection and try again.",
            }])
        } finally { setChatLoading(false) }
    }

    const confirmCreateTask = async (parsed) => {
        try {
            await taskApi.create({
                title: parsed.title,
                categoryId: null, // AI parsed categories are currently loose names, backend needs ID
                priority: parsed.priority || 'MEDIUM',
                deadline: parsed.date || null,
                estimatedHours: 1,
                status: 'TODO',
                workspaceId: activeWorkspace?.id || null
            })
            toast.success(`Task "${parsed.title}" created!`)
            setChatMessages(m => m.map(msg =>
                msg.type === 'NLP' && msg.parsed === parsed
                    ? { ...msg, confirmed: true, text: `✅ Task "${parsed.title}" created successfully!`, type: 'CHAT' }
                    : msg
            ))
        } catch (e) {
            toast.error('Failed to create task: ' + (e.response?.data?.message || 'Unknown error'))
        }
    }

    const dismissNlp = (reason, originalInput) => {
        if (reason === 'NOT_A_TASK') {
            aiApi.feedback(originalInput, 'CHAT_NOT_NLP').catch(() => {})
            toast.success("Thanks for the feedback! I'm learning.")
        }
        setChatMessages(m => m.map(msg =>
            msg.type === 'NLP' && msg.parsed?.originalInput === originalInput
                ? { ...msg, type: 'CHAT', text: 'Task creation cancelled.', parsed: null }
                : msg
        ))
    }

    const loadSchedule  = async () => { try { const r = await aiApi.generateSchedule(); setSchedule(r.data) } catch { toast.error('Failed to generate schedule') } }
    const loadPrioritize = async () => { try { const r = await aiApi.prioritizeTasks(); setPrioritized(r.data) } catch { toast.error('Failed to prioritize') } }
    const loadInsights  = async () => { try { const r = await aiApi.getInsights(); setInsights(r.data) } catch { toast.error('Failed to load insights') } }

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const PRIORITY_COLORS = { URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' }

    const SUGGESTIONS = [
        'Help me focus better',
        'Study math at 5 PM tomorrow',
        'Beat procrastination tips',
        'Meeting with team next Monday at 10 AM',
    ]

    // Simple markdown bold renderer
    const renderText = (text) =>
        text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>AI Features</h1>
                    <p>Intelligent productivity tools powered by your data</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AiStatusPill status={aiStatus} />
                    <div className="ai-gemini-badge">
                        <MdPsychology />
                        <span>100% Private & Local</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="ai-tabs">
                {TABS.map(t => (
                    <button key={t.id} className={`ai-tab ${activeTab === t.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.id)}>
                        <span className="ai-tab-icon">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="ai-content">

                {/* ── Unified Chat + NLP Tab ── */}
                {activeTab === 'chat' && (
                    <div className="chat-panel">
                        {/* Chat header */}
                        <div className="chat-header">
                            <div className="chat-bot-info">
                                <div className="chat-bot-avatar">
                                    <MdSmartToy />
                                    <span className="chat-bot-online" />
                                </div>
                                <div>
                                    <p className="chat-bot-name">FocusAI Coach</p>
                                    <p className="chat-bot-status">
                                        {aiStatus?.engine === 'FOCUSFLOW_BRAIN'
                                            ? '🟢 FocusFlow Brain · Live'
                                            : '🟡 Smart rule-based mode'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {aiStatus && (
                                    <div className="ai-engine-badge" title={aiStatus.internet ? 'Internet OK' : 'Offline'}>
                                        {aiStatus.internet ? <MdWifi /> : <MdWifiOff />}
                                    </div>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={() => setChatMessages([{
                                    role: 'ai', type: 'CHAT',
                                    text: "Hey! I'm your local FocusFlow assistant. Everything we discuss stays right here on your machine.\n\nNeed help crushing procrastination, prioritizing your day, or want me to instantly schedule a task like **\"Study math at 5 PM tomorrow\"**? Just let me know! ✨"
                                }])}>
                                    <MdRefresh /> Clear
                                </button>
                            </div>
                        </div>

                        {/* NLP hint banner */}
                        <div className="nlp-hint-banner">
                            <MdAutoAwesome />
                            <span>Tip: Type a task command like <em>&quot;Study physics at 6 PM tomorrow&quot;</em> and I&apos;ll auto-create it for you!</span>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {chatMessages.map((m, i) => (
                                <div key={i} className={`chat-msg ${m.role}`}>
                                    {m.role === 'ai' && (
                                        <div className="chat-avatar ai-av"><MdSmartToy /></div>
                                    )}
                                    <div className="chat-bubble-wrap">
                                        {m.type === 'NLP' && !m.confirmed && m.parsed ? (
                                            <>
                                                <div className="chat-bubble">
                                                    {renderText(m.text)}
                                                </div>
                                                <NlpCard
                                                    parsed={m.parsed}
                                                    onConfirm={confirmCreateTask}
                                                    onDismiss={() => dismissNlp(m.parsed)}
                                                />
                                            </>
                                        ) : (
                                            <div className="chat-bubble">
                                                {renderText(m.text)}
                                                {m.role === 'ai' && i === 0 && (
                                                    <div className="chat-gemini-tag">
                                                        <MdPsychology /> Local AI
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {m.role === 'user' && (
                                        <div className="chat-avatar user-av"><MdPerson /></div>
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="chat-msg ai">
                                    <div className="chat-avatar ai-av"><MdSmartToy /></div>
                                    <div className="chat-bubble-wrap">
                                        <div className="chat-bubble typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="chat-input-area">
                            <div className="chat-suggestions">
                                {SUGGESTIONS.map(s => (
                                    <button key={s} className="chat-suggestion"
                                        onClick={() => { setChatInput(s) }}>
                                        <MdStar /> {s}
                                    </button>
                                ))}
                            </div>
                            <div className="chat-input-row">
                                <input
                                    className="input"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                                    placeholder='Ask anything, or type "Study math at 5 PM tomorrow"'
                                />
                                <button className="btn btn-primary chat-send-btn"
                                    onClick={sendChat}
                                    disabled={chatLoading || !chatInput.trim()}>
                                    <MdSend />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Smart Schedule ── */}
                {activeTab === 'schedule' && (
                    <div className="glass-card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3>Schedule Suggestions</h3>
                            <button className="btn btn-primary btn-sm" onClick={loadSchedule}><MdRefresh /> Regenerate</button>
                        </div>
                        {schedule.length === 0
                            ? <div className="empty-state"><div className="empty-state-icon"><MdSchedule /></div><p>No tasks to schedule yet. Add some tasks first!</p></div>
                            : schedule.map((slot, i) => (
                                <div key={i} className="schedule-slot">
                                    <div className="slot-day">{DAYS[slot.dayOfWeek]}</div>
                                    <div className="slot-time">{slot.suggestedStart?.slice(11, 16)} – {slot.suggestedEnd?.slice(11, 16)}</div>
                                    <div className="slot-body">
                                        <strong>{slot.taskTitle}</strong>
                                        <span className="badge" style={{ background: `${PRIORITY_COLORS[slot.priority]}22`, color: PRIORITY_COLORS[slot.priority], fontSize: '0.7rem', marginLeft: 8 }}>{slot.priority}</span>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{slot.reason}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* ── Prioritize ── */}
                {activeTab === 'prioritize' && (
                    <div className="glass-card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3>Task Prioritization</h3>
                            <button className="btn btn-primary btn-sm" onClick={loadPrioritize}><MdRefresh /> Refresh</button>
                        </div>
                        {prioritized.length === 0
                            ? <div className="empty-state"><div className="empty-state-icon"><MdTimeline /></div><p>No active tasks to prioritize</p></div>
                            : prioritized.map((t, i) => (
                                <div key={t.taskId} className="priority-row">
                                    <div className="priority-rank">#{i + 1}</div>
                                    <div className="priority-body">
                                        <strong>{t.title}</strong>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{t.recommendation}</p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                            <span className="badge" style={{ background: `${PRIORITY_COLORS[t.priority]}22`, color: PRIORITY_COLORS[t.priority], fontSize: '0.7rem' }}>{t.priority}</span>
                                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{t.category}</span>
                                        </div>
                                    </div>
                                    <div className="priority-score">
                                        <span className="score-val">{t.aiScore}</span>
                                        <span className="score-lbl">AI Score</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* ── Decompose ── */}
                {activeTab === 'decompose' && (
                    <div className="glass-card" style={{ padding: 28 }}>
                        <div style={{ marginBottom: 24 }}>
                            <h3>Smart Task Decomposer</h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                Break a large goal into 5 actionable sub-tasks using the local LLM.
                            </p>
                        </div>
                        
                        <div className="chat-input-row" style={{ marginBottom: 24 }}>
                            <input
                                className="input"
                                value={decomposeInput}
                                onChange={e => setDecomposeInput(e.target.value)}
                                placeholder='e.g., "Build a full-stack dashboard" or "Write a research paper"'
                                onKeyDown={e => e.key === 'Enter' && handleDecompose()}
                            />
                            <button 
                                className="btn btn-primary" 
                                onClick={handleDecompose}
                                disabled={decomposeLoading || !decomposeInput.trim()}
                            >
                                {decomposeLoading ? <div className="spinner" /> : <><MdAutoAwesome /> Decompose</>}
                            </button>
                        </div>

                        {decomposedTasks.length > 0 && (
                            <div className="decomposed-results fade-in">
                                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--accent-violet)' }}>Suggested Sub-tasks:</h4>
                                <div className="decomposed-list">
                                    {decomposedTasks.map((task, i) => (
                                        <div key={i} className="decomposed-item">
                                            <span className="item-num">{i + 1}</span>
                                            <span>{task}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {decomposedTasks.length === 0 && !decomposeLoading && (
                            <div className="empty-state">
                                <div className="empty-state-icon"><MdGridView /></div>
                                <p>Enter a complex task above to get started.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Insights ── */}
                {activeTab === 'insights' && (
                    <div className="glass-card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3>Productivity Insights</h3>
                            <button className="btn btn-primary btn-sm" onClick={loadInsights}><MdRefresh /> Refresh</button>
                        </div>
                        {insights.length === 0
                            ? <div className="empty-state"><div className="empty-state-icon"><MdLightbulb /></div><p>No insights yet. Complete some tasks first!</p></div>
                            : insights.map((insight, i) => (
                                <div key={i} className="insight-card">{insight}</div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    )
}
