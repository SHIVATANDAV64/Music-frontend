import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'solid' | 'ghost';
    children: React.ReactNode;
}

export const MagneticButton = ({
    children,
    variant = 'solid',
    className = '',
    ...props
}: MagneticButtonProps) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!btnRef.current) return;
        const { left, top, width, height } = btnRef.current.getBoundingClientRect();

        const x = (e.clientX - (left + width / 2)) * 0.2; // Reduced sensitivity for sturdier feel
        const y = (e.clientY - (top + height / 2)) * 0.2;

        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const baseStyles = "relative px-8 py-3 font-mono text-sm uppercase tracking-widest transition-all duration-200 ease-out group overflow-hidden";
    const variants = {
        solid: "bg-[#D4AF37] text-black hover:bg-[#F4CF57] border border-[#D4AF37]",
        ghost: "bg-transparent text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
    };

    return (
        <button
            ref={btnRef}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            {...props}
        >
            {/* Tech Corners */}
            <span className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-50" />
            <span className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-50" />

            {/* Hover Decoration */}
            {variant === 'solid' && (
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </button>
    );
};
