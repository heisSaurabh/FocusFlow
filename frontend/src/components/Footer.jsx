import './Footer.css'

export default function Footer() {
    return (
        <footer className="synapse-footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <h2 className="font-serif text-shimmer">FocusFlow</h2>
                    <p>Your intelligent productivity companion</p>
                </div>
                <div className="footer-col">
                    <h4 className="mono">TOOLS</h4>
                    <a href="/tasks">Task Board</a>
                    <a href="/timetable">Schedule</a>
                    <a href="/pomodoro">Focus Timer</a>
                </div>
                <div className="footer-col">
                    <h4 className="mono">INSIGHTS</h4>
                    <a href="/ai">AI Coach</a>
                    <a href="/analytics">Analytics</a>
                </div>
                <div className="footer-col">
                    <h4 className="mono">ACCOUNT</h4>
                    <a href="/profile">Profile</a>
                </div>
            </div>
            <div className="footer-bottom">
                <span className="mono">© 2026 FOCUSFLOW</span>
                <div className="system-status">
                    <div className="status-dot"></div>
                    <span className="mono">ALL SYSTEMS OPERATIONAL</span>
                </div>
            </div>
        </footer>
    )
}
