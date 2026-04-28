import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import './NetworkStatusBanner.css'

/**
 * NetworkStatusBanner
 * ─ Listens to browser online/offline events
 * ─ Shows a persistent top banner when offline
 * ─ Toasts when connection changes
 */
export default function NetworkStatusBanner() {
    const [online, setOnline] = useState(navigator.onLine)
    const first = useRef(true)

    useEffect(() => {
        const handleOnline = () => {
            setOnline(true)
            if (!first.current) {
                toast.success('🌐 Back online — Gemini AI is active!', { duration: 3500 })
            }
            first.current = false
        }
        const handleOffline = () => {
            setOnline(false)
            toast.error('📵 No internet — AI switched to offline mode.', {
                duration: 5000,
                icon: '📵',
            })
            first.current = false
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (online) return null

    return (
        <div className="network-banner" role="alert">
            <span className="network-banner-icon">📵</span>
            <span>You are <strong>offline</strong> — AI Coach is running in rule-based mode. Some features may be unavailable.</span>
        </div>
    )
}
