import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import './AuthPage.css'

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ email: '', password: '' })
    const [rememberMe, setRememberMe] = useState(false)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        const cachedEmail = localStorage.getItem('remembered_email')
        const cachedPassword = localStorage.getItem('remembered_password')
        if (cachedEmail && cachedPassword) {
            setCredentials({ email: cachedEmail, password: cachedPassword })
            setRememberMe(true)
        }
    }, [])

    async function handleLoginSubmit(event) {
        event.preventDefault()
        setIsAuthenticating(true)
        try {
            const loginResponse = await authApi.login(credentials)
            if (rememberMe) {
                localStorage.setItem('remembered_email', credentials.email)
                localStorage.setItem('remembered_password', credentials.password)
            } else {
                localStorage.removeItem('remembered_email')
                localStorage.removeItem('remembered_password')
            }
            login(loginResponse.data)
            toast.success(`Welcome back, ${loginResponse.data.name}! 👋`)
            navigate('/')
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed. Check your credentials.'
            toast.error(errorMessage)
        } finally {
            setIsAuthenticating(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-bg-shapes">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="shape shape-3" />
            </div>

            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <img src="/logo.png" alt="FocusFlow" className="auth-logo-img" />
                    <h1>Welcome Back</h1>
                    <p>Sign in to your productivity workspace</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={credentials.email}
                            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-eye-wrap">
                            <input
                                className="input"
                                type={isPasswordVisible ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                required
                            />
                            <button type="button" className="eye-btn" onClick={() => setIsPasswordVisible(s => !s)} tabIndex={-1}>
                                {isPasswordVisible ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group remember-me-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                            />
                            <span>Remember Me</span>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={isAuthenticating}>
                        {isAuthenticating ? <><div className="spinner" /> Signing in...</> : '→ Sign In'}
                    </button>
                </form>

                <div className="auth-hint">
                    <p className="demo-hint">🔑 Demo: <code>alice@example.com</code> / <code>password123</code></p>
                </div>

                <p className="auth-footer-text">
                    New here? <Link to="/register">Create an account →</Link>
                </p>
            </div>
        </div>
    )
}
