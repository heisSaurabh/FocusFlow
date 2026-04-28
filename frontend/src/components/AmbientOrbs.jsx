export default function AmbientOrbs() {
    return (
        <div className="ambient-orbs-wrap" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div className="ambient-orb orb-1" />
            <div className="ambient-orb orb-2" />
            <style>{`
                .ambient-orb {
                    position: absolute;
                    border-radius: 50%;
                    transition: background 0.6s ease;
                }
                .orb-1 {
                    top: -10%; left: 10%; width: 40vw; height: 40vw;
                    background: rgba(139, 92, 246, 0.35);
                    filter: blur(120px);
                    animation: floatOrb 12s ease-in-out infinite;
                }
                .orb-2 {
                    bottom: 10%; right: 10%; width: 35vw; height: 35vw;
                    background: rgba(6, 182, 212, 0.2);
                    filter: blur(100px);
                    animation: floatOrb 15s ease-in-out infinite reverse;
                }
                [data-theme="light"] .orb-1 {
                    background: rgba(251, 146, 60, 0.15);
                }
                [data-theme="light"] .orb-2 {
                    background: rgba(251, 191, 36, 0.08);
                }
            `}</style>
        </div>
    )
}
