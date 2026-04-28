import { useState, useEffect, useCallback } from 'react'
import { taskApi, categoryApi, aiApi } from '../api/api'
import { useWorkspaceStore } from '../store/workspaceStore'
import toast from 'react-hot-toast'
import { MdAdd, MdDelete, MdEdit, MdAutoAwesome } from 'react-icons/md'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'
import './TasksPage.css'

const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Done' }
const STATUS_COLORS = { TODO: '#6366f1', IN_PROGRESS: '#f59e0b', COMPLETED: '#22c55e' }
const PRIORITY_COLORS = { URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' }
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const defaultForm = (firstCategoryId) => ({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO',
    categoryId: firstCategoryId || '', deadline: '', estimatedHours: 1.0,
    isRecurring: false, recurringPattern: null
})

export default function TasksPage() {
    const { activeWorkspace } = useWorkspaceStore()
    const [tasks, setTasks] = useState([])
    const [categories, setCategories] = useState([])   // fetched from API
    const [showForm, setShowForm] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [form, setForm] = useState(defaultForm(null))
    const [filter, setFilter] = useState({ status: '', categoryId: '', priority: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [decomposing, setDecomposing] = useState(null)
    const [selectedIds, setSelectedIds] = useState(new Set())

    const load = useCallback(async () => {
        try {
            const res = await taskApi.getAll(activeWorkspace?.id)
            setTasks(res.data)
        } catch { toast.error('Failed to load tasks') }
        finally { setLoading(false) }
    }, [activeWorkspace?.id])

    useEffect(() => {
        load()
        // Load categories once
        categoryApi.getAll()
            .then(res => {
                setCategories(res.data)
                // set default categoryId to first category
                if (res.data.length > 0) {
                    setForm(f => ({ ...f, categoryId: res.data[0].id }))
                }
            })
            .catch(() => {})
    }, [load])

    const openCreate = () => { setEditTask(null); setForm(defaultForm(categories[0]?.id)); setShowForm(true) }
    const openEdit = (t) => {
        setEditTask(t)
        setForm({
            title: t.title, description: t.description || '',
            priority: t.priority, status: t.status,
            categoryId: t.categoryId || (categories[0]?.id) || '',
            deadline: t.deadline ? t.deadline.slice(0, 16) : '',
            estimatedHours: t.estimatedHours
        })
        setShowForm(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Parse estimatedHours as a number (HTML inputs always return strings)
            const estimatedHours = form.estimatedHours ? parseFloat(form.estimatedHours) : 1.0

            // Send date only (YYYY-MM-DD)
            const deadline = form.deadline || null

            const payload = {
                title: form.title,
                description: form.description || null,
                priority: form.priority || 'MEDIUM',
                status: form.status || 'TODO',
                categoryId: form.categoryId ? Number(form.categoryId) : null,
                deadline,
                estimatedHours,
                isRecurring: form.isRecurring || false,
                recurringPattern: form.recurringPattern || null,
                workspaceId: activeWorkspace?.id || null,
            }
            if (editTask) {
                await taskApi.update(editTask.id, payload)
                toast.success('Task updated!')
            } else {
                await taskApi.create(payload)
                toast.success('Task created!')
            }
            setShowForm(false)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save task')
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this task?')) return
        try { await taskApi.delete(id); toast.success('Task deleted'); load() }
        catch { toast.error('Failed to delete') }
    }

    const handleStatusChange = async (task, newStatus) => {
        try {
            await taskApi.update(task.id, {
                title: task.title,
                description: task.description || null,
                priority: task.priority,
                status: newStatus,
                categoryId: task.categoryId || null,
                deadline: task.deadline || null,
                estimatedHours: task.estimatedHours || 1.0,
                isRecurring: task.isRecurring || false,
            })
            load()
        } catch { toast.error('Failed to update status') }
    }

    const handleDecompose = async (task) => {
        setDecomposing(task.id)
        try {
            const res = await aiApi.decomposeTask(task.title)
            const subtasks = res.data
            let created = 0
            for (const st of subtasks) {
                await taskApi.create({
                    title: st,
                    priority: task.priority,
                    status: 'TODO',
                    categoryId: task.categoryId || null,
                    estimatedHours: 0.5,
                    workspaceId: activeWorkspace?.id || null
                })
                created++
            }
            toast.success(`Decomposed into ${created} sub-tasks!`)
            load()
        } catch {
            toast.error('Failed to decompose task via AI')
        } finally {
            setDecomposing(null)
        }
    }

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectAllFiltered = () => {
        const ids = filtered.map(t => t.id)
        if (selectedIds.size === ids.length && ids.every(id => selectedIds.has(id))) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(ids))
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} selected tasks?`)) return
        const ids = Array.from(selectedIds)
        setLoading(true)
        try {
            await Promise.all(ids.map(id => taskApi.delete(id)))
            toast.success(`Deleted ${ids.length} tasks`)
            setSelectedIds(new Set())
            load()
        } catch {
            toast.error('Failed to delete some tasks')
        } finally {
            setLoading(false)
        }
    }

    const handleBulkStatusChange = async (newStatus) => {
        const ids = Array.from(selectedIds)
        const tasksToUpdate = tasks.filter(t => selectedIds.has(t.id))
        setLoading(true)
        try {
            await Promise.all(tasksToUpdate.map(task => taskApi.update(task.id, {
                title: task.title,
                description: task.description || null,
                priority: task.priority,
                status: newStatus,
                categoryId: task.categoryId || null,
                deadline: task.deadline || null,
                estimatedHours: task.estimatedHours || 1.0,
                isRecurring: task.isRecurring || false,
            })))
            toast.success(`Updated ${ids.length} tasks to ${STATUS_LABELS[newStatus]}`)
            setSelectedIds(new Set())
            load()
        } catch {
            toast.error('Failed to update some tasks')
        } finally {
            setLoading(false)
        }
    }

    // Apply filters
    const filtered = tasks.filter(t =>
        (!filter.status || t.status === filter.status) &&
        (!filter.categoryId || String(t.categoryId) === String(filter.categoryId)) &&
        (!filter.priority || t.priority === filter.priority)
    )

    // Group by status for kanban view
    const grouped = STATUSES.reduce((acc, s) => {
        acc[s] = filtered.filter(t => t.status === s)
        return acc
    }, {})

    return (
        <>
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>Tasks</h1>
                    <p>{tasks.length} tasks total · {tasks.filter(t => t.status === 'COMPLETED').length} completed</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><MdAdd /> New Task</button>
            </div>

            {/* Filters */}
            <div className="tasks-filters">
                <CustomSelect 
                    className="filter-select"
                    placeholder="All Statuses"
                    value={filter.status}
                    onChange={val => setFilter({ ...filter, status: val })}
                    options={[
                        { value: '', label: 'All Statuses' },
                        ...STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))
                    ]}
                />
                <CustomSelect 
                    className="filter-select"
                    placeholder="All Categories"
                    value={filter.categoryId}
                    onChange={val => setFilter({ ...filter, categoryId: val })}
                    options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map(c => ({ value: c.id, label: c.name }))
                    ]}
                />
                <CustomSelect 
                    className="filter-select"
                    placeholder="All Priorities"
                    value={filter.priority}
                    onChange={val => setFilter({ ...filter, priority: val })}
                    options={[
                        { value: '', label: 'All Priorities' },
                        ...PRIORITIES.map(p => ({ value: p, label: p }))
                    ]}
                />
                {(filter.status || filter.categoryId || filter.priority) &&
                    <button className="btn btn-secondary btn-sm" onClick={() => setFilter({ status: '', categoryId: '', priority: '' })}>Clear</button>}
                
                <button className="btn btn-ghost btn-sm" onClick={selectAllFiltered}>
                    {selectedIds.size > 0 && selectedIds.size === filtered.length ? 'Deselect All' : 'Select All Filtered'}
                </button>
            </div>

            {/* Kanban Board */}
            {loading
                ? <div style={{ display: 'flex', gap: 16 }}>{STATUSES.map(s => <div key={s} className="skeleton" style={{ height: 200, flex: 1, borderRadius: 12 }} />)}</div>
                : <div className="kanban-board">
                    {STATUSES.map(status => (
                        <div key={status} className="kanban-column">
                            <div className="kanban-header" style={{ borderColor: STATUS_COLORS[status] }}>
                                <span className="kanban-title">{STATUS_LABELS[status]}</span>
                                <span className="kanban-count">{grouped[status]?.length || 0}</span>
                            </div>
                            <div className="kanban-cards">
                                {grouped[status]?.length === 0
                                    ? <div className="kanban-empty">No tasks here</div>
                                    : grouped[status].map(task => (
                                        <div key={task.id} className={`task-card ${selectedIds.has(task.id) ? 'selected' : ''}`} style={{ borderLeftColor: PRIORITY_COLORS[task.priority] || '#6366f1' }}>
                                            <div className="task-card-header">
                                                <input 
                                                    type="checkbox" 
                                                    className="task-checkbox" 
                                                    checked={selectedIds.has(task.id)}
                                                    onChange={() => toggleSelect(task.id)}
                                                />
                                                <span className="task-card-title" onClick={() => toggleSelect(task.id)}>{task.title}</span>
                                                <div className="task-card-actions">
                                                    <button className="icon-btn" onClick={() => handleDecompose(task)} title="Magic Decompose" disabled={decomposing === task.id}>
                                                        {decomposing === task.id ? <div className="spinner" style={{ width: 14, height: 14 }}/> : <MdAutoAwesome style={{ color: 'var(--accent-violet)' }} />}
                                                    </button>
                                                    <button className="icon-btn" onClick={() => openEdit(task)} title="Edit"><MdEdit /></button>
                                                    <button className="icon-btn danger" onClick={() => handleDelete(task.id)} title="Delete"><MdDelete /></button>
                                                </div>
                                            </div>
                                            {task.description && <p className="task-card-desc">{task.description}</p>}
                                            <div className="task-card-meta">
                                                <span className="badge" style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority], fontSize: '0.7rem' }}>
                                                    {task.priority}
                                                </span>
                                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                                    {task.categoryName || 'Uncategorized'}
                                                </span>
                                                {task.deadline && (
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                        Due {task.deadline}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Status change select */}
                                            <CustomSelect 
                                                className="status-select"
                                                value={task.status}
                                                onChange={val => handleStatusChange(task, val)}
                                                options={STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                                            />
                                            {task.aiScore && (
                                                <div className="ai-score">AI Score: {task.aiScore}</div>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            }

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bulk-action-bar fade-in">
                    <div className="bulk-info">
                        <strong>{selectedIds.size}</strong> tasks selected
                    </div>
                    <div className="bulk-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatusChange('COMPLETED')}>Mark Done</button>
                        <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Delete Selected</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>Cancel</button>
                    </div>
                </div>
            )}
        </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
                    <div className="modal fade-in">
                        <h3>{editTask ? 'Edit Task' : 'Create New Task'}</h3>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Title *</label>
                                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Task title..." />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." style={{ resize: 'vertical' }} />
                            </div>
                            <div className="grid-2">
                                <CustomSelect 
                                    label="Priority"
                                    value={form.priority}
                                    onChange={val => setForm({ ...form, priority: val })}
                                    options={PRIORITIES.map(p => ({ value: p, label: p }))}
                                />
                                <CustomSelect 
                                    label="Category"
                                    value={form.categoryId}
                                    onChange={val => setForm({ ...form, categoryId: val })}
                                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                                />
                                <CustomSelect 
                                    label="Status"
                                    value={form.status}
                                    onChange={val => setForm({ ...form, status: val })}
                                    options={STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                                />
                                <div className="form-group">
                                    <label>Estimated Hours</label>
                                    <input className="input" type="number" min="0.25" max="100" step="0.25"
                                        value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
                                </div>
                            </div>
                            <CustomDatePicker 
                                label="Deadline"
                                value={form.deadline}
                                onChange={val => setForm({ ...form, deadline: val })}
                            />

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <><div className="spinner" /> Saving...</> : editTask ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
