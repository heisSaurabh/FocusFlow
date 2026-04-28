import { useState, useEffect, useCallback } from 'react'
import { categoryApi } from '../api/api'
import toast from 'react-hot-toast'
import { MdAdd, MdDelete, MdSettingsSystemDaydream, MdCategory } from 'react-icons/md'
import './AdminDashboardPage.css'

export default function AdminDashboardPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('categories')

    const load = useCallback(async () => {
        try {
            const res = await categoryApi.getAll()
            setCategories(res.data)
        } catch { toast.error('Failed to load system data') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return
        setSaving(true)
        try {
            await categoryApi.create({ 
                name: newName.trim().toUpperCase()
            })
            toast.success(`System Category "${newName}" added!`)
            setNewName('')
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add category')
        } finally { setSaving(false) }
    }

    const handleDeleteCategory = async (id, name) => {
        if (!confirm(`Delete system category "${name}"? Tasks using it will lose their category.`)) return
        try {
            await categoryApi.delete(id)
            toast.success(`System Category "${name}" deleted`)
            load()
        } catch { toast.error('Cannot delete — category may be in use') }
    }

    return (
        <div className="page fade-in admin-dashboard">
            <div className="page-header">
                <div>
                    <h1><MdSettingsSystemDaydream style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-orange)' }} /> System Management</h1>
                    <p>Manage core system functionalities and global configurations</p>
                </div>
            </div>

            <div className="admin-layout">
                {/* Sidebar Navigation */}
                <div className="admin-sidebar glass-card">
                    <button 
                        className={`admin-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <MdCategory /> System Categories
                    </button>
                    {/* Placeholder for future system functionalities */}
                    <button className="admin-nav-btn disabled" disabled title="Coming soon">
                        More System Settings...
                    </button>
                </div>

                {/* Content Area */}
                <div className="admin-content">
                    {activeTab === 'categories' && (
                        <>
                            <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 20 }}>Add System Category</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    These categories will be available to all users across the platform.
                                </p>
                                <form onSubmit={handleAddCategory} className="admin-form-inline">
                                    <input className="input" placeholder="e.g. SYSTEM_UPDATE" value={newName}
                                        onChange={e => setNewName(e.target.value)} required />
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? <><div className="spinner" /> Adding...</> : <><MdAdd /> Add</>}
                                    </button>
                                </form>
                            </div>

                            <div className="glass-card" style={{ padding: 28 }}>
                                <h3 style={{ marginBottom: 20 }}>Global Categories</h3>
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="empty-state"><p>No system categories found</p></div>
                                ) : (
                                    <div className="admin-list">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="admin-list-item">
                                                <div className="admin-list-icon" />
                                                <span className="admin-list-name">{cat.name}</span>
                                                {cat.user === null ? (
                                                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', color: '#fff', background: 'var(--accent-orange)' }}>Global</span>
                                                ) : (
                                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>User</span>
                                                )}
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
