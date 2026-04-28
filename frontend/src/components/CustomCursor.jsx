import { useEffect, useRef, useState } from 'react'
import './CustomCursor.css'

export default function CustomCursor() {
    const dotRef = useRef(null)
    const ringRef = useRef(null)
    const posRef = useRef({ x: -100, y: -100 })
    const ringPos = useRef({ x: -100, y: -100 })
    const rafRef = useRef(null)
    const [clicked, setClicked] = useState(false)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        const onMove = (e) => {
            posRef.current = { x: e.clientX, y: e.clientY }
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
            }
        }

        const onDown = () => setClicked(true)
        const onUp = () => setClicked(false)

        // Track interactive elements
        const onEnter = (e) => {
            if (e.target.matches('a, button, input, select, textarea, label, [role="button"], .sidebar-link, .btn, .task-card, .quick-action-btn, .ai-tab')) {
                setHovered(true)
            }
        }
        const onLeave = () => setHovered(false)

        // Smooth ring follows with lerp
        const animate = () => {
            const dx = posRef.current.x - ringPos.current.x
            const dy = posRef.current.y - ringPos.current.y
            ringPos.current.x += dx * 0.12
            ringPos.current.y += dy * 0.12
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`
            }
            rafRef.current = requestAnimationFrame(animate)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mousedown', onDown)
        window.addEventListener('mouseup', onUp)
        document.addEventListener('mouseover', onEnter)
        document.addEventListener('mouseout', onLeave)
        rafRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mousedown', onDown)
            window.removeEventListener('mouseup', onUp)
            document.removeEventListener('mouseover', onEnter)
            document.removeEventListener('mouseout', onLeave)
            cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <>
            <div
                ref={dotRef}
                className={`cursor-dot ${clicked ? 'clicked' : ''} ${hovered ? 'hovered' : ''}`}
            />
            <div
                ref={ringRef}
                className={`cursor-ring ${clicked ? 'clicked' : ''} ${hovered ? 'hovered' : ''}`}
            />
        </>
    )
}
