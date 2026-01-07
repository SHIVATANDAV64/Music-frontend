
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({
    children,
    className = '',
    hoverEffect = false,
    ...props
}: GlassCardProps) => {
    return (
        <div
            className={`
                relative overflow-hidden
                backdrop-blur-md bg-[#0a0a0a]/80 border border-[#222]
                transition-all duration-300
                ${hoverEffect ? 'hover:border-[#D4AF37] hover:bg-[#0f0f0f]' : ''}
                ${className}
            `}
            {...props}
        >
            {/* Tech Corner Decorators */}
            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r border-[#333] transition-colors ${hoverEffect ? 'group-hover:border-[#D4AF37]' : ''}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#333] transition-colors ${hoverEffect ? 'group-hover:border-[#D4AF37]' : ''}`} />

            {/* Internal gradients for sheen effect - made more subtle/technical */}
            <div className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:animate-shine" />

            {children}
        </div>
    );
};
