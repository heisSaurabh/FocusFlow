import { useState, useRef, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval } from 'date-fns'
import { MdChevronLeft, MdChevronRight, MdCalendarToday } from 'react-icons/md'
import './CustomDatePicker.css'

export default function CustomDatePicker({ value, onChange, label, placeholder = 'Select date' }) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
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

    const handleDateClick = (day) => {
        onChange(format(day, 'yyyy-MM-dd'))
        setIsOpen(false)
    }

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const renderHeader = () => (
        <div className="calendar-header">
            <button type="button" onClick={prevMonth} className="calendar-nav-btn"><MdChevronLeft /></button>
            <span className="calendar-current-month">{format(currentMonth, 'MMMM yyyy')}</span>
            <button type="button" onClick={nextMonth} className="calendar-nav-btn"><MdChevronRight /></button>
        </div>
    )

    const renderDays = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        return (
            <div className="calendar-days-grid">
                {days.map(d => <div key={d} className="calendar-day-label">{d}</div>)}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
        const selectedDate = value ? new Date(value) : null

        return (
            <div className="calendar-cells-grid">
                {calendarDays.map((day, i) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isToday = isSameDay(day, new Date())

                    return (
                        <div
                            key={i}
                            className={`calendar-cell ${!isCurrentMonth ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => handleDateClick(day)}
                        >
                            {format(day, 'd')}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="custom-datepicker-container" ref={containerRef}>
            {label && <label className="custom-datepicker-label">{label}</label>}
            <div className="datepicker-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span className={`datepicker-value ${!value ? 'placeholder' : ''}`}>
                    {value ? format(new Date(value), 'PPP') : placeholder}
                </span>
                <MdCalendarToday className="datepicker-icon" />
            </div>

            {isOpen && (
                <div className="calendar-dropdown glass-card fade-in">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                    <div className="calendar-footer">
                        <button type="button" className="btn-today" onClick={() => handleDateClick(new Date())}>Today</button>
                        <button type="button" className="btn-clear" onClick={() => { onChange(''); setIsOpen(false); }}>Clear</button>
                    </div>
                </div>
            )}
        </div>
    )
}
