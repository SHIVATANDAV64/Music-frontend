

interface CinematicTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export const CinematicText = ({ text, className = '', delay = 0 }: CinematicTextProps) => {
    const words = text.split(' ');

    return (
        <h1 className={`text-hero overflow-hidden ${className}`}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em] last:mr-0 align-bottom">
                    <span
                        className="inline-block animate-slide-up bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent opacity-0 fill-mode-forwards"
                        style={{
                            animationDelay: `${delay + (i * 0.1)}s`,
                            animationDuration: '1.2s',
                            animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
                        }}
                    >
                        {word}
                    </span>
                </span>
            ))}
            <style>{`
        @keyframes slide-up {
          from { transform: translateY(110%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </h1>
    );
};
