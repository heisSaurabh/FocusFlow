import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import NetworkStatusBanner from './components/NetworkStatusBanner'
import CustomCursor from './components/CustomCursor'
import AvatarMascot from './components/AvatarMascot'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import TimetablePage from './pages/TimetablePage'
import AiPage from './pages/AiPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PomodoroPage from './pages/PomodoroPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import SharedTimetablePage from './pages/SharedTimetablePage'

import NavPill from './components/NavPill'
import Footer from './components/Footer'
import AmbientOrbs from './components/AmbientOrbs'

// ── Protected Route Wrapper ────────────────────────────────────────────────
function PrivateRoute({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? children : <Navigate to="/login" replace />
}

// ── App Layout ─────────────────────────────────────────────────────────────
function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <AmbientOrbs />
            <NavPill />
            <main className="main-content">
                {children}
            </main>
            <Footer />
            <AvatarMascot />
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <CustomCursor />
            <NetworkStatusBanner />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '14px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.875rem',
                        backdropFilter: 'blur(16px)',
                        boxShadow: 'var(--shadow-card)',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: 'var(--bg-card)' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: 'var(--bg-card)' } },
                }}
            />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes inside app layout */}
                <Route path="/" element={
                    <PrivateRoute>
                        <AppLayout><DashboardPage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/tasks" element={
                    <PrivateRoute>
                        <AppLayout><TasksPage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/timetable" element={
                    <PrivateRoute>
                        <AppLayout><TimetablePage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/ai" element={
                    <PrivateRoute>
                        <AppLayout><AiPage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/analytics" element={
                    <PrivateRoute>
                        <AppLayout><AnalyticsPage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/pomodoro" element={
                    <PrivateRoute>
                        <AppLayout><PomodoroPage /></AppLayout>
                    </PrivateRoute>
                } />
                <Route path="/profile" element={
                    <PrivateRoute>
                        <AppLayout><ProfilePage /></AppLayout>
                    </PrivateRoute>
                } />

                <Route path="/admin" element={
                    <PrivateRoute>
                        <AppLayout><AdminDashboardPage /></AppLayout>
                    </PrivateRoute>
                } />

                <Route path="/shared/:token" element={<AppLayout><SharedTimetablePage /></AppLayout>} />

                {/* Catch-all → dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
