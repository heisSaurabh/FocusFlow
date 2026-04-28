import './ShinyButton.css'
export default function ShinyButton({ children, onClick, className = '' }) {
    return (
        <div className={`shiny-btn-wrap ${className}`}>
            <button className="shiny-btn-inner" onClick={onClick}>
                {children}
            </button>
        </div>
    )
}
