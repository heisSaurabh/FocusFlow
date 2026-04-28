import { useEffect, useRef, useState, useCallback } from 'react'
import './AvatarMascot.css'

// Lerp helper
const lerp = (a, b, t) => a + (b - a) * t

// Eye socket centers (relative to SVG viewBox 100x100)
const leftEyeCenter = { x: 35, y: 42 }
const rightEyeCenter = { x: 65, y: 42 }
const maxPupilOffset = 5.5

const clampPupil = (target, center) => {
    const dx = target.x - center.x
    const dy = target.y - center.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > maxPupilOffset) {
        return {
            x: center.x + (dx / dist) * maxPupilOffset,
            y: center.y + (dy / dist) * maxPupilOffset,
        }
    }
    return target
}

export default function AvatarMascot() {
    const leftPupilRef = useRef({ x: 0, y: 0 })
    const rightPupilRef = useRef({ x: 0, y: 0 })
    const targetRef = useRef({ lx: 0, ly: 0, rx: 0, ry: 0 })
    const svgRef = useRef(null)
    const rafRef = useRef(null)
    const [isBlinking, setIsBlinking] = useState(false)
    const [expression, setExpression] = useState('happy') // happy | surprised | wink
    const [tilt, setTilt] = useState(0)
    const [leftPupilPos, setLeftPupilPos] = useState({ x: 0, y: 0 })
    const [rightPupilPos, setRightPupilPos] = useState({ x: 0, y: 0 })

    const onMouseMove = useCallback((e) => {
        const svg = svgRef.current
        if (!svg) return
        const rect = svg.getBoundingClientRect()
        const svgW = rect.width
        const svgH = rect.height

        // Convert mouse to SVG coordinates (viewBox 0 0 100 100)
        const svgX = ((e.clientX - rect.left) / svgW) * 100
        const svgY = ((e.clientY - rect.top) / svgH) * 100

        // Angle for subtle tilt
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        const tiltDeg = Math.sin(angle) * 6
        setTilt(tiltDeg)

        targetRef.current = {
            lx: svgX,
            ly: svgY,
            rx: svgX,
            ry: svgY,
        }
    }, [])

    // Animation loop
    useEffect(() => {
        const animate = () => {
            const { lx, ly, rx, ry } = targetRef.current

            const newLX = lerp(leftPupilRef.current.x, lx, 0.1)
            const newLY = lerp(leftPupilRef.current.y, ly, 0.1)
            const newRX = lerp(rightPupilRef.current.x, rx, 0.1)
            const newRY = lerp(rightPupilRef.current.y, ry, 0.1)

            leftPupilRef.current = { x: newLX, y: newLY }
            rightPupilRef.current = { x: newRX, y: newRY }

            const lClamped = clampPupil({ x: newLX, y: newLY }, leftEyeCenter)
            const rClamped = clampPupil({ x: newRX, y: newRY }, rightEyeCenter)

            setLeftPupilPos(lClamped)
            setRightPupilPos(rClamped)

            rafRef.current = requestAnimationFrame(animate)
        }

        // Initialize refs to eye centers
        leftPupilRef.current = { x: leftEyeCenter.x, y: leftEyeCenter.y }
        rightPupilRef.current = { x: rightEyeCenter.x, y: rightEyeCenter.y }
        targetRef.current = { lx: leftEyeCenter.x, ly: leftEyeCenter.y, rx: rightEyeCenter.x, ry: rightEyeCenter.y }

        setLeftPupilPos(leftEyeCenter)
        setRightPupilPos(rightEyeCenter)

        rafRef.current = requestAnimationFrame(animate)
        window.addEventListener('mousemove', onMouseMove)

        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('mousemove', onMouseMove)
        }
    }, [onMouseMove])

    // Blink every 3–6 seconds
    useEffect(() => {
        const scheduleBlink = () => {
            const delay = 3000 + Math.random() * 3000
            return setTimeout(() => {
                setIsBlinking(true)
                setTimeout(() => setIsBlinking(false), 180)
                blinkTimer.current = scheduleBlink()
            }, delay)
        }
        const blinkTimer = { current: scheduleBlink() }
        return () => clearTimeout(blinkTimer.current)
    }, [])

    const handleClick = () => {
        const exprs = ['happy', 'surprised', 'wink']
        setExpression(prev => {
            const idx = exprs.indexOf(prev)
            return exprs[(idx + 1) % exprs.length]
        })
    }

    // Mouth path based on expression
    const mouthPath = {
        happy:    'M 38 60 Q 50 68 62 60',
        surprised:'M 42 57 Q 50 67 58 57',
        wink:     'M 38 60 Q 50 68 62 60',
    }

    // Which eye to "wink" (close)
    const leftEyeClosed = isBlinking || expression === 'wink'
    const rightEyeClosed = isBlinking

    return (
        <div
            className="avatar-mascot"
            style={{ transform: `rotate(${tilt}deg)` }}
            onClick={handleClick}
            title="Click me!"
        >
            <div className="avatar-glow-ring" />
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="avatar-svg"
            >
                {/* Head */}
                <circle cx="50" cy="52" r="38" fill="url(#headGrad)" />

                {/* Gradient defs */}
                <defs>
                    <radialGradient id="headGrad" cx="40%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#2a2a4a" />
                        <stop offset="100%" stopColor="#1a1a30" />
                    </radialGradient>
                    <radialGradient id="eyeGrad" cx="50%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#e8e8ff" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Subtle cheek blush */}
                <ellipse cx="24" cy="58" rx="7" ry="4" fill="rgba(236,72,153,0.18)" />
                <ellipse cx="76" cy="58" rx="7" ry="4" fill="rgba(236,72,153,0.18)" />

                {/* Left Eye socket */}
                <ellipse cx={leftEyeCenter.x} cy={leftEyeCenter.y} rx="11" ry="11" fill="url(#eyeGrad)" />
                {/* Left Blink */}
                {leftEyeClosed
                    ? <rect x="24" y="39.5" width="22" height="5" rx="2.5" fill="#1a1a30" />
                    : <>
                        <circle cx={leftPupilPos.x} cy={leftPupilPos.y} r="5.5" fill="#1e1e3a" />
                        <circle cx={leftPupilPos.x} cy={leftPupilPos.y} r="3.5" fill="#6366f1" />
                        <circle cx={leftPupilPos.x - 1.5} cy={leftPupilPos.y - 1.5} r="1.5" fill="#fff" opacity="0.9" />
                    </>
                }

                {/* Right Eye socket */}
                <ellipse cx={rightEyeCenter.x} cy={rightEyeCenter.y} rx="11" ry="11" fill="url(#eyeGrad)" />
                {/* Right Blink */}
                {rightEyeClosed
                    ? <rect x="54" y="39.5" width="22" height="5" rx="2.5" fill="#1a1a30" />
                    : <>
                        <circle cx={rightPupilPos.x} cy={rightPupilPos.y} r="5.5" fill="#1e1e3a" />
                        <circle cx={rightPupilPos.x} cy={rightPupilPos.y} r="3.5" fill="#6366f1" />
                        <circle cx={rightPupilPos.x - 1.5} cy={rightPupilPos.y - 1.5} r="1.5" fill="#fff" opacity="0.9" />
                    </>
                }

                {/* Mouth */}
                <path
                    d={mouthPath[expression]}
                    fill="none"
                    stroke={expression === 'surprised' ? '#f59e0b' : '#818cf8'}
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* Surprised open mouth */}
                {expression === 'surprised' && (
                    <ellipse cx="50" cy="62" rx="7" ry="5" fill="#0d0d1a" stroke="#f59e0b" strokeWidth="1.5" />
                )}

                {/* Antenna / top decoration */}
                <circle cx="50" cy="14" r="4" fill="#6366f1" filter="url(#glow)" />
                <line x1="50" y1="14" x2="50" y2="20" stroke="#818cf8" strokeWidth="2" />

                {/* Subtle headphone arc */}
                <path d="M 20 52 A 30 30 0 0 1 80 52" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Expression label */}
            <div className="avatar-label">
                {expression === 'happy' && '😊'}
                {expression === 'surprised' && '😮'}
                {expression === 'wink' && '😉'}
            </div>
        </div>
    )
}
