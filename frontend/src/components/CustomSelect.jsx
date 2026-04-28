import { useState, useRef, useEffect } from 'react'
import { MdKeyboardArrowDown } from 'react-icons/md'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, placeholder, label, className = '', disabled = false, onOpen }) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => String(opt.value) === String(value))
    const displayLabel = selectedOption ? selectedOption.label : placeholder

    return (
        <div className={`custom-select-container ${className}`} ref={containerRef}>
            {label && <label className="custom-select-label">{label}</label>}
            <button 
                type="button"
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => {
                    if (disabled) return;
                    if (!isOpen && onOpen) onOpen();
                    setIsOpen(!isOpen);
                }}
                disabled={disabled}
            >
                <span className="custom-select-value">{displayLabel}</span>
                <MdKeyboardArrowDown className={`custom-select-arrow ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="custom-select-dropdown glass-card fade-in">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`custom-select-option ${String(opt.value) === String(value) ? 'active' : ''}`}
                            onClick={() => {
                                onChange(opt.value)
                                setIsOpen(false)
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
