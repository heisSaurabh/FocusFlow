import { useState, useEffect } from 'react'
import { timetableApi, scheduleApi, taskApi } from '../api/api'
import { useWorkspaceStore } from '../store/workspaceStore'
import toast from 'react-hot-toast'
import { MdAdd, MdDelete, MdCalendarViewMonth, MdTimeline, MdShare, MdContentCopy } from 'react-icons/md'
import { Gantt, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"
import './TimetablePage.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6 AM – 9 PM

export default function TimetablePage() {
    const { activeWorkspace } = useWorkspaceStore()
    const [timetables, setTimetables] = useState([])
    const [active, setActive] = useState(null)
    const [entries, setEntries] = useState([])
    const [tasks, setTasks] = useState([])
    const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'timeline'
    const [showCreate, setShowCreate] = useState(false)
    const [showEntry, setShowEntry] = useState(false)
    const [ttForm, setTtForm] = useState({ name: '', description: '', type: 'WEEKLY' })
    const [entryForm, setEntryForm] = useState({ title: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })
    const [saving, setSaving] = useState(false)

    const toggleShare = async () => {
        if (!active) return
        try {
            const isPublic = !active.isPublic
            const r = await timetableApi.toggleShare(active.id, isPublic)
            setActive(r.data)
            setTimetables(timetables.map(t => t.id === r.data.id ? r.data : t))
            if (isPublic) {
                const link = `${window.location.origin}/shared/${r.data.shareToken}`
                navigator.clipboard.writeText(link)
                toast.success('Public link copied to clipboard!')
            } else {
                toast.success('Sharing disabled')
            }
        } catch { toast.error('Failed to update sharing') }
    }

    useEffect(() => {
        Promise.all([
            timetableApi.getAll(activeWorkspace?.id),
            taskApi.getAll(activeWorkspace?.id)
        ]).then(([ttRes, taskRes]) => {
            const ttList = ttRes.data || []
            setTimetables(ttList)
            setTasks(taskRes.data || [])
            if (ttList.length > 0) loadEntries(ttList[0])
            else { setActive(null); setEntries([]) }
        })
    }, [activeWorkspace?.id])

    const loadEntries = async (tt) => {
        setActive(tt)
        try {
            const r = await scheduleApi.getEntries(tt.id)
            setEntries(r.data || [])
        } catch { setEntries([]) }
    }

    const createTimetable = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            const r = await timetableApi.create({ ...ttForm, workspaceId: activeWorkspace?.id || null })
            const list = [...timetables, r.data]
            setTimetables(list)
            loadEntries(r.data)
            setShowCreate(false)
            toast.success('Timetable created!')
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setSaving(false) }
    }

    const addEntry = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            await scheduleApi.addEntry(active.id, entryForm)
            const r = await scheduleApi.getEntries(active.id)
            setEntries(r.data || [])
            setShowEntry(false)
            toast.success('Entry added!')
        } catch (err) { toast.error(err.response?.data?.message || 'Failed (conflict?)') }
        finally { setSaving(false) }
    }

    const deleteEntry = async (eId) => {
        if (!confirm('Delete this entry?')) return
        try {
            await scheduleApi.deleteEntry(active.id, eId)
            setEntries(entries.filter(e => e.id !== eId))
            toast.success('Entry deleted')
        } catch { toast.error('Failed') }
    }

    // Calculate pixel position in weekly grid
    const entryStyle = (e) => {
        const [sh, sm] = e.startTime.split(':').map(Number)
        const [eh, em] = e.endTime.split(':').map(Number)
        const top = (sh - 6) * 60 + sm
        const height = (eh - 6) * 60 + em - top
        return { top: `${top}px`, height: `${Math.max(height, 30)}px`, background: '#6366f1' }
    }

    // Transform tasks for Gantt
    const ganttTasks = tasks.map(t => {
        const start = t.createdAt ? new Date(t.createdAt) : new Date()
        const end = t.deadline ? new Date(t.deadline) : new Date(start.getTime() + 24 * 60 * 60 * 1000)
        
        // Ensure end is after start for Gantt component
        const finalEnd = end > start ? end : new Date(start.getTime() + 3600000)

        return {
            start: start,
            end: finalEnd,
            name: t.title,
            id: t.id.toString(),
            type: 'task',
            progress: t.status === 'COMPLETED' ? 100 : 0,
            styles: { backgroundColor: t.priority === 'URGENT' ? '#ef4444' : '#6366f1', progressColor: '#10b981' }
        }
    })

    return (
        <>
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>📅 Timetable</h1>
                    <p>Weekly schedule & Project timelines</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div className="view-mode-toggle">
                        <button 
                            className={`btn btn-secondary ${viewMode === 'calendar' ? 'active' : ''}`} 
                            onClick={() => setViewMode('calendar')}
                            title="Calendar View"
                        >
                            <MdCalendarViewMonth />
                        </button>
                        <button 
                            className={`btn btn-secondary ${viewMode === 'timeline' ? 'active' : ''}`} 
                            onClick={() => setViewMode('timeline')}
                            title="Timeline View"
                        >
                            <MdTimeline />
                        </button>
                    </div>
                    {viewMode === 'calendar' && active && (
                        <button 
                            className={`btn ${active.isPublic ? 'btn-primary' : 'btn-secondary'}`} 
                            onClick={toggleShare}
                            title={active.isPublic ? 'Sharing is ON' : 'Share Schedule'}
                        >
                            <MdShare /> {active.isPublic ? 'Shared' : 'Share'}
                        </button>
                    )}
                    {viewMode === 'calendar' && active && <button className="btn btn-secondary" onClick={() => setShowEntry(true)}><MdAdd /> Add Entry</button>}
                    {viewMode === 'calendar' && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> New Timetable</button>}
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <>
                    {/* Timetable selector tabs */}
                    {timetables.length > 0 && (
                        <div className="tt-tabs">
                            {timetables.map(tt => (
                                <button key={tt.id} className={`tt-tab ${active?.id === tt.id ? 'active' : ''}`} onClick={() => loadEntries(tt)}>
                                    {tt.name}
                                    {tt.isActive && <span className="active-dot" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Weekly Grid */}
                    {active ? (
                        <div className="weekly-grid-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="weekly-grid">
                                <div className="grid-time-col" />
                                {DAYS.map(d => <div key={d} className="grid-day-header">{d}</div>)}

                                {HOURS.map(h => (
                                    <div key={h} style={{ display: 'contents' }}>
                                        <div className="grid-time-label">{h}:00</div>
                                        {DAYS.map((_, di) => (
                                            <div key={`cell${h}${di}`} className="grid-cell" style={{ position: 'relative' }}>
                                                {h === 6 && entries.filter(e => e.dayOfWeek === di).map(e => (
                                                    <div key={e.id} className="grid-entry" style={entryStyle(e)}
                                                        title={`${e.title}\n${e.startTime}–${e.endTime}`}>
                                                        <span className="entry-title">{e.title}</span>
                                                        <span className="entry-time">{e.startTime}–{e.endTime}</span>
                                                        <button className="entry-del" onClick={() => deleteEntry(e.id)}><MdDelete /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card empty-state">
                            <div className="empty-state-icon">📅</div>
                            <h3>No timetable yet</h3>
                            <p>Create your first timetable to get started</p>
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> Create Timetable</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="timeline-container fade-in">
                    <div className="glass-card" style={{ padding: 24, overflow: 'auto' }}>
                        <h3 style={{ marginBottom: 20 }}>Project Timeline</h3>
                        {ganttTasks.length > 0 ? (
                            <div className="gantt-wrap">
                                <Gantt 
                                    tasks={ganttTasks} 
                                    viewMode={ViewMode.Day}
                                    listCellWidth=""
                                    columnWidth={65}
                                />
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No tasks with dates found. Add deadlines to tasks to see them on the timeline.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Create Timetable Modal */}
        {showCreate && (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
                <div className="modal fade-in">
                    <h3>Create Timetable</h3>
                    <form onSubmit={createTimetable} className="modal-form">
                        <div className="form-group"><label>Name *</label>
                            <input className="input" value={ttForm.name} onChange={e => setTtForm({ ...ttForm, name: e.target.value })} required placeholder="e.g. Weekly Study Plan" />
                        </div>
                        <div className="form-group"><label>Description</label>
                            <textarea className="input" rows={2} value={ttForm.description} onChange={e => setTtForm({ ...ttForm, description: e.target.value })} placeholder="Optional..." style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-group"><label>Type</label>
                            <select className="input" value={ttForm.type} onChange={e => setTtForm({ ...ttForm, type: e.target.value })}>
                                <option value="WEEKLY">Weekly</option>
                                <option value="DAILY">Daily</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Add Entry Modal */}
        {showEntry && active && (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEntry(false) }}>
                <div className="modal fade-in">
                    <h3>Add Schedule Entry</h3>
                    <form onSubmit={addEntry} className="modal-form">
                        <div className="form-group"><label>Title *</label>
                            <input className="input" value={entryForm.title} onChange={e => setEntryForm({ ...entryForm, title: e.target.value })} required placeholder="e.g. Data Structures Lecture" />
                        </div>
                        <div className="grid-2">
                            <div className="form-group"><label>Day</label>
                                <select className="input" value={entryForm.dayOfWeek} onChange={e => setEntryForm({ ...entryForm, dayOfWeek: parseInt(e.target.value) })}>
                                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Start Time</label>
                                <input className="input" type="time" value={entryForm.startTime} onChange={e => setEntryForm({ ...entryForm, startTime: e.target.value })} />
                            </div>
                            <div className="form-group"><label>End Time</label>
                                <input className="input" type="time" value={entryForm.endTime} onChange={e => setEntryForm({ ...entryForm, endTime: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEntry(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Entry'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    )
}
