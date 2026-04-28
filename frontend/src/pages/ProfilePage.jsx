import { useState, useEffect, useRef } from 'react'
import { userApi, taskApi, analyticsApi, workspaceApi } from '../api/api'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import toast from 'react-hot-toast'
import { MdEmail, MdPhone, MdEdit, MdSave, MdLock, MdVerified, MdTask, MdTimer, MdBarChart, MdCamera, MdCloudUpload, MdBusiness, MdAdd, MdDelete } from 'react-icons/md'
import './ProfilePage.css'

export default function ProfilePage() {
    const { user, setUser, isAuthenticated } = useAuthStore()
    const { workspaces, setWorkspaces } = useWorkspaceStore()
    const [profile, setProfile] = useState({ name: '', phone: '', bio: '', dailyWorkHoursGoal: 8 })
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
    const [wsName, setWsName] = useState('')
    const [wsDesc, setWsDesc] = useState('')
    const [saving, setSaving] = useState(false)
    const [pwSaving, setPwSaving] = useState(false)
    const [wsSaving, setWsSaving] = useState(false)
    const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, focusScore: 0 })
    const [editMode, setEditMode] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083'
    const getAvatarSrc = (url) => {
        if (!url) return null
        return url.startsWith('http') ? url : `${BACKEND}${url}`
    }

    useEffect(() => {
        userApi.getMe().then(r => {
            const u = r.data
            setProfile({ name: u.name || '', phone: u.phone || '', bio: u.bio || '', dailyWorkHoursGoal: u.dailyWorkHoursGoal || 8 })
            if (u.avatarUrl) setAvatarUrl(u.avatarUrl)
        })
        taskApi.getAll().then(r => {
            const tasks = r.data || []
            setStats(s => ({ ...s, totalTasks: tasks.length, completedTasks: tasks.filter(t => t.status === 'COMPLETED').length }))
        }).catch(() => {})
        analyticsApi.getScore().then(r => {
            setStats(s => ({ ...s, focusScore: r.data?.productivityScore || 0 }))
        }).catch(() => {})
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            workspaceApi.getAll().then(r => setWorkspaces(r.data || [])).catch(() => {})
        }
    }, [isAuthenticated, setWorkspaces])

    const handleCreateWorkspace = async (e) => {
        e.preventDefault()
        if (!wsName.trim()) return
        setWsSaving(true)
        try {
            const r = await workspaceApi.create({ name: wsName, description: wsDesc })
            setWorkspaces([...workspaces, r.data])
            setWsName(''); setWsDesc('')
            toast.success('Workspace created!')
        } catch { toast.error('Failed to create workspace') }
        finally { setWsSaving(false) }
    }

    const handleDeleteWorkspace = async (id) => {
        if (!confirm('Are you sure? This will delete the workspace record.')) return
        try {
            await workspaceApi.delete(id)
            setWorkspaces(workspaces.filter(w => w.id !== id))
            toast.success('Workspace removed')
        } catch { toast.error('Failed to delete') }
    }

    const handleAvatarFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return }
        if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return }
        setAvatarPreview(URL.createObjectURL(file))
    }

    const handleAvatarUpload = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file) { toast.error('No file selected'); return }
        setUploading(true)
        try {
            const fd = new FormData(); fd.append('file', file)
            const r = await userApi.uploadAvatar(fd)
            setAvatarUrl(r.data.avatarUrl); setAvatarPreview(null)
            toast.success('Profile picture updated!')
        } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
    }

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            const r = await userApi.updateMe({ ...profile, dailyWorkHoursGoal: String(profile.dailyWorkHoursGoal) })
            setUser({ ...user, name: r.data.name })
            toast.success('Profile updated!'); setEditMode(false)
        } catch { toast.error('Failed to update profile') }
        finally { setSaving(false) }
    }

    const handlePassword = async (e) => {
        e.preventDefault()
        if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return }
        if (pwForm.newPassword.length < 8) { toast.error('Min 8 characters'); return }
        setPwSaving(true)
        try {
            await userApi.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
            toast.success('Password changed!'); setPwForm({ oldPassword: '', newPassword: '', confirm: '' })
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setPwSaving(false) }
    }

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
    const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

    return (
        <div className="page profile-page stagger-enter">
            <div className="page-header">
                <div>
                    <h1 className="font-serif">Profile</h1>
                    <p>Manage your account and preferences</p>
                </div>
            </div>

            <div className="profile-layout">
                {/* ── Left: Avatar + Summary ─── */}
                <div className="profile-sidebar glass-card">
                    {/* Avatar */}
                    <div className="profile-avatar-area">
                        <div className="profile-avatar-ring">
                            <div className="profile-avatar">
                                {avatarPreview || avatarUrl ? (
                                    <img src={avatarPreview || getAvatarSrc(avatarUrl)} alt="Profile" />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                        </div>
                        <button className="avatar-camera-btn" onClick={() => fileInputRef.current?.click()} title="Change avatar">
                            <MdCamera />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                    </div>

                    {avatarPreview && (
                        <div className="avatar-upload-bar">
                            <button className="btn btn-primary btn-sm" onClick={handleAvatarUpload} disabled={uploading}>
                                {uploading ? <><div className="spinner" />Uploading...</> : <><MdCloudUpload />Save Photo</>}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setAvatarPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} disabled={uploading}>Cancel</button>
                        </div>
                    )}

                    <h3 className="profile-name font-serif">{user?.name}</h3>
                    <div className="profile-email"><MdEmail /><span>{user?.email}</span></div>

                    <div className="profile-roles">
                        {user?.roles?.map(r => (
                            <span key={r} className="badge badge-primary">
                                <MdVerified /> {r.replace ? r.replace('ROLE_', '') : r}
                            </span>
                        ))}
                    </div>

                    <div className="profile-divider" />

                    {/* Stats */}
                    <div className="profile-stats-grid">
                        <div className="profile-stat-box">
                            <div className="profile-stat-icon" style={{ color: '#a78bfa' }}><MdTask /></div>
                            <div className="profile-stat-val">{stats.totalTasks}</div>
                            <div className="profile-stat-lbl">Total Tasks</div>
                        </div>
                        <div className="profile-stat-box">
                            <div className="profile-stat-icon" style={{ color: '#34d399' }}><MdTimer /></div>
                            <div className="profile-stat-val">{stats.completedTasks}</div>
                            <div className="profile-stat-lbl">Completed</div>
                        </div>
                        <div className="profile-stat-box">
                            <div className="profile-stat-icon" style={{ color: '#22d3ee' }}><MdBarChart /></div>
                            <div className="profile-stat-val">{completionRate}%</div>
                            <div className="profile-stat-lbl">Done Rate</div>
                        </div>
                    </div>

                    {/* Focus score */}
                    <div className="focus-score-wrap">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Focus Score</span>
                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{stats.focusScore}/100</span>
                        </div>
                        <div className="focus-score-bar">
                            <div className="focus-score-fill" style={{ width: `${stats.focusScore}%` }} />
                        </div>
                    </div>
                </div>

                {/* ── Right: Forms ──────────────────── */}
                <div className="profile-forms">
                    {/* Edit Profile */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1rem' }}><MdEdit style={{ marginRight: 6 }} />Edit Profile</h3>
                            {!editMode && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}><MdEdit />Edit</button>
                            )}
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} disabled={!editMode} />
                                </div>
                                <div className="form-group">
                                    <label><MdPhone style={{ marginRight: 4 }} />Phone</label>
                                    <input className="input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 ..." disabled={!editMode} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Bio</label>
                                    <textarea className="input" rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="About yourself..." style={{ resize: 'vertical' }} disabled={!editMode} />
                                </div>
                                <div className="form-group">
                                    <label>Daily Work Hours Goal</label>
                                    <input className="input" type="number" min={1} max={16} value={profile.dailyWorkHoursGoal} onChange={e => setProfile({ ...profile, dailyWorkHoursGoal: e.target.value })} disabled={!editMode} />
                                </div>
                            </div>
                            {editMode && (
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                        {saving ? <><div className="spinner" />Saving...</> : <><MdSave />Save Changes</>}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="glass-card">
                        <h3 style={{ fontSize: '1rem', marginBottom: 24 }}><MdLock style={{ marginRight: 6 }} />Change Password</h3>
                        <form onSubmit={handlePassword}>
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input className="input" type="password" value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={pwSaving}>
                                    {pwSaving ? <><div className="spinner" />Updating...</> : <><MdLock />Update Password</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Workspace Management (v3.0) */}
                    <div className="glass-card">
                        <h3 style={{ fontSize: '1rem', marginBottom: 24 }}><MdBusiness style={{ marginRight: 6 }} />Manage Workspaces</h3>
                        
                        <form onSubmit={handleCreateWorkspace} style={{ marginBottom: 24 }}>
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label>New Workspace Name</label>
                                    <input className="input" value={wsName} onChange={e => setWsName(e.target.value)} placeholder="e.g. Side Hustle" required />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <input className="input" value={wsDesc} onChange={e => setWsDesc(e.target.value)} placeholder="What is this for?" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={wsSaving}>
                                    {wsSaving ? 'Creating...' : <><MdAdd /> Create Workspace</>}
                                </button>
                            </div>
                        </form>

                        <div className="ws-list-admin">
                            {workspaces.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No custom workspaces created yet.</p>
                            ) : (
                                workspaces.map(ws => (
                                    <div key={ws.id} className="ws-admin-item">
                                        <div>
                                            <div className="ws-admin-name">{ws.name}</div>
                                            <div className="ws-admin-desc">{ws.description || 'No description'}</div>
                                        </div>
                                        <button className="icon-btn danger" onClick={() => handleDeleteWorkspace(ws.id)} title="Delete Workspace">
                                            <MdDelete />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
