import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import {
    MdDashboard, MdTask, MdCalendarMonth, MdAutoAwesome,
    MdBarChart, MdTimer, MdPerson, MdLogout, MdCategory,
    MdLightMode, MdDarkMode, MdChevronRight
} from 'react-icons/md'
import './Sidebar.css'

function getTheme() {
    return localStorage.getItem('theme') || 'dark'
}

const navItems = [
    { to: '/', icon: MdDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: MdTask, label: 'Tasks' },
    { to: '/timetable', icon: MdCalendarMonth, label: 'Timetable' },
    { to: '/pomodoro', icon: MdTimer, label: 'Pomodoro' },
    { to: '/ai', icon: MdAutoAwesome, label: 'AI Coach' },
    { to: '/analytics', icon: MdBarChart, label: 'Analytics' },
    { to: '/profile', icon: MdPerson, label: 'Profile' },
]

export default function Sidebar() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [theme, setTheme] = useState(getTheme)
    const isAdmin = user?.roles?.some(r => r.name === 'ROLE_ADMIN')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U'

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <img src="/logo.png" alt="FocusFlow logo" className="logo-img" />
                </div>
                <div className="logo-text">
                    <span className="logo-title">FocusFlow</span>
                    <span className="logo-sub">Productivity Manager</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">MENU</div>
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="sidebar-link-icon"><Icon /></span>
                            <span className="sidebar-link-label">{item.label}</span>
                            <span className="sidebar-link-arrow"><MdChevronRight /></span>
                        </NavLink>
                    )
                })}
                {isAdmin && (
                    <NavLink to="/admin/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span className="sidebar-link-icon"><MdCategory /></span>
                        <span className="sidebar-link-label">Categories</span>
                        <span className="sidebar-link-arrow"><MdChevronRight /></span>
                    </NavLink>
                )}
            </nav>

            {/* Footer: User + theme toggle + logout */}
            <div className="sidebar-footer">
                <button className="sidebar-user" onClick={() => navigate('/profile')} title="Go to profile">
                    <div className="user-avatar">
                        <span className="user-avatar-initials">{initials}</span>
                        <div className="user-avatar-ring" />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <span className="user-email">{user?.email || ''}</span>
                    </div>
                </button>
                <div className="sidebar-footer-actions">
                    <button className="sidebar-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
                        {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
                    </button>
                    <button className="sidebar-logout" onClick={handleLogout} title="Logout">
                        <MdLogout />
                    </button>
                </div>
            </div>
        </aside>
    )
}
