import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { workspaceApi } from '../api/api'
import { MdLightMode, MdDarkMode, MdBusiness, MdKeyboardArrowDown, MdAdd } from 'react-icons/md'
import './NavPill.css'

const NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/timetable', label: 'Schedule' },
    { to: '/pomodoro', label: 'Focus' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/ai', label: 'AI' },
]

function getTheme() {
    return localStorage.getItem('theme') || 'dark'
}

export default function NavPill() {
    const { logout, user, isAdmin, isAuthenticated } = useAuthStore()
    const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [wsDropdownOpen, setWsDropdownOpen] = useState(false)
    const [theme, setTheme] = useState(getTheme)
    
    const adminMode = isAdmin()

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        if (isAuthenticated) {
            workspaceApi.getAll().then(r => setWorkspaces(r.data || [])).catch(() => {})
        }
    }, [isAuthenticated, setWorkspaces])

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <>
            <div className="nav-pill-container">
                <nav className="nav-pill glass-panel">
                    {/* Brand */}
                    <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
                        <div className="nav-logo-dot" />
                        <span className="nav-brand-text font-serif">FocusFlow</span>
                    </Link>

                    {/* Workspace Selector */}
                    <div className="workspace-selector-wrap">
                        <button className="ws-toggle" onClick={() => setWsDropdownOpen(!wsDropdownOpen)}>
                            <MdBusiness />
                            <span className="ws-name">{activeWorkspace?.name || 'Personal'}</span>
                            <MdKeyboardArrowDown className={`ws-arrow ${wsDropdownOpen ? 'open' : ''}`} />
                        </button>
                        
                        {wsDropdownOpen && (
                            <div className="ws-dropdown glass-card">
                                <div className="ws-dropdown-label">WORKSPACES</div>
                                <button 
                                    className={`ws-item ${!activeWorkspace ? 'active' : ''}`}
                                    onClick={() => { setActiveWorkspace(null); setWsDropdownOpen(false); }}
                                >
                                    Personal (Default)
                                </button>
                                {workspaces.map(ws => (
                                    <button 
                                        key={ws.id} 
                                        className={`ws-item ${activeWorkspace?.id === ws.id ? 'active' : ''}`}
                                        onClick={() => { setActiveWorkspace(ws); setWsDropdownOpen(false); }}
                                    >
                                        {ws.name}
                                    </button>
                                ))}
                                <div className="ws-divider" />
                                <button className="ws-item ws-add" onClick={() => { setWsDropdownOpen(false); navigate('/profile'); }}>
                                    <MdAdd /> Manage Workspaces
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Desktop links */}
                    <div className="nav-links">
                        {NAV_LINKS.map(l => (
                            <Link
                                key={l.to}
                                to={l.to}
                                className={`nav-link${location.pathname === l.to ? ' active' : ''}`}
                            >
                                {l.label}
                            </Link>
                        ))}
                        {adminMode && (
                            <Link
                                to="/admin"
                                className={`nav-link admin-link ${location.pathname.startsWith('/admin') ? ' active' : ''}`}
                            >
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Desktop actions */}
                    <div className="nav-actions">
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <div className="theme-toggle-track">
                                <div className={`theme-toggle-thumb ${theme}`}>
                                    {theme === 'dark' ? <MdDarkMode /> : <MdLightMode />}
                                </div>
                            </div>
                        </button>

                        <Link to="/profile" className="nav-avatar" title={user?.name}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Link>
                        <button className="btn btn-sm btn-primary" onClick={handleLogout}>Sign Out</button>
                    </div>

                    <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)}>
                        <span /> <span /> <span />
                    </button>
                </nav>
            </div>

            {/* Mobile menu drawer */}
            {mobileOpen && (
                <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="nav-mobile-drawer" onClick={e => e.stopPropagation()}>
                        <div className="nav-mobile-header">
                            <span className="font-serif" style={{ fontSize: '1.3rem' }}>FocusFlow</span>
                            <button className="icon-btn" onClick={() => setMobileOpen(false)}>✕</button>
                        </div>
                        <div className="mobile-ws-section">
                            <p className="mobile-section-label">Active Workspace</p>
                            <div className="mobile-ws-list">
                                <button className={`mobile-ws-btn ${!activeWorkspace ? 'active' : ''}`} onClick={() => setActiveWorkspace(null)}>Personal</button>
                                {workspaces.map(ws => (
                                    <button key={ws.id} className={`mobile-ws-btn ${activeWorkspace?.id === ws.id ? 'active' : ''}`} onClick={() => setActiveWorkspace(ws)}>{ws.name}</button>
                                ))}
                            </div>
                        </div>
                        <div className="nav-mobile-links">
                            {NAV_LINKS.map(l => (
                                <Link key={l.to} to={l.to} className={`nav-mobile-link${location.pathname === l.to ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>{l.label}</Link>
                            ))}
                            {adminMode && (
                                <Link to="/admin" className={`nav-mobile-link admin-link ${location.pathname.startsWith('/admin') ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>Admin</Link>
                            )}
                        </div>
                        <button className="btn btn-danger btn-sm" style={{ marginTop: 'auto' }} onClick={handleLogout}>Sign Out</button>
                    </div>
                </div>
            )}
        </>
    )
}
