import React, { useState } from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const InputGroup = ({ label, id, ...props }: InputGroupProps) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    return (
        <div className="group relative mb-8">
            <input
                id={id}
                className="peer block w-full bg-transparent border-b border-[#333] py-3 text-white placeholder-transparent focus:border-[#D4AF37] focus:outline-none transition-colors duration-300 font-mono text-sm tracking-wide z-10 relative"
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                    setFocused(false);
                    setHasValue(e.target.value.length > 0);
                }}
                onChange={(e) => setHasValue(e.target.value.length > 0)}
                {...props}
            />

            {/* Label */}
            <label
                htmlFor={id}
                className={`
                    absolute left-0 transition-all duration-300 pointer-events-none font-mono uppercase tracking-widest
                    ${(focused || hasValue)
                        ? '-top-3 text-[10px] text-[#D4AF37]'
                        : 'top-3 text-xs text-[#666]'}
                `}
            >
                {label}
            </label>

            {/* Tech Underline Effect */}
            <div className={`absolute bottom-0 left-0 h-[1px] bg-[#D4AF37] transition-all duration-500 ease-in-out ${focused ? 'w-full' : 'w-0'}`} />

            {/* Status indicator on right */}
            <div className={`absolute right-0 top-3 w-1.5 h-1.5 rounded-full transition-colors ${hasValue ? 'bg-[#D4AF37]' : 'bg-[#333]'}`} />
        </div>
    );
};
