import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import './AuthPage.css'

export default function RegisterPage() {
    const [userData, setUserData] = useState({ name: '', email: '', password: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [revealPassword, setRevealPassword] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate()

    async function handleRegisterSubmit(event) {
        event.preventDefault()
        
        if (userData.password.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }
        
        setIsSubmitting(true)
        try {
            const registrationResponse = await authApi.register(userData)
            login(registrationResponse.data)
            toast.success(`Account created! Welcome, ${registrationResponse.data.name}! 🎉`)
            navigate('/')
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Registration failed.'
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-bg-shapes">
                <div className="shape shape-1" /><div className="shape shape-2" /><div className="shape shape-3" />
            </div>
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <img src="/logo.png" alt="FocusFlow" className="auth-logo-img" />
                    <h1>Create Account</h1>
                    <p>Start your productivity journey today</p>
                </div>
                <form onSubmit={handleRegisterSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="input" type="text" placeholder="Alice Johnson"
                            value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input className="input" type="email" placeholder="you@example.com"
                            value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min 8 chars)</span></label>
                        <div className="input-eye-wrap">
                            <input className="input" type={revealPassword ? 'text' : 'password'} placeholder="••••••••"
                                value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} required />
                            <button type="button" className="eye-btn" onClick={() => setRevealPassword(s => !s)} tabIndex={-1}>
                                {revealPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={isSubmitting}>
                        {isSubmitting ? <><div className="spinner" /> Creating account...</> : '→ Create Account'}
                    </button>
                </form>
                <p className="auth-footer-text">
                    Already have an account? <Link to="/login">Sign in →</Link>
                </p>
            </div>
        </div>
    )
}
