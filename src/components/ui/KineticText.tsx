/**
 * KineticText - Animated Text Reveal Component
 * Creates staggered text animations for headlines with character or word-level control
 * Used for hero headlines and section titles for premium "wow" effect
 */
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface KineticTextProps {
    /** Text to animate */
    text: string;
    /** Animation type */
    type?: 'char' | 'word';
    /** HTML tag to render */
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
    /** Additional CSS classes */
    className?: string;
    /** Delay before animation starts (ms) */
    delay?: number;
    /** Stagger delay between elements (ms) */
    staggerDelay?: number;
    /** Whether to trigger animation */
    animate?: boolean;
    /** Gradient text style */
    gradient?: 'gold' | 'violet' | 'mixed' | 'none';
}

const charVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        filter: 'blur(8px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.8,
            ease: [0.2, 0.65, 0.3, 0.9], // Smoother, less snappy
        },
    },
};

const wordVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        filter: 'blur(4px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.8,
            ease: [0.2, 0.65, 0.3, 0.9],
        },
    },
};

export function KineticText({
    text,
    type = 'char',
    as: Tag = 'h1',
    className = '',
    delay = 0,
    staggerDelay = 30, // Slightly faster stagger for smoother flow
    animate = true,
    gradient = 'none',
}: KineticTextProps) {
    const elements = type === 'char'
        ? text.split('')
        : text.split(' ');

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: staggerDelay / 1000,
                delayChildren: delay / 1000,
            },
        },
    };

    const getGradientClass = () => {
        switch (gradient) {
            case 'gold': return 'text-[var(--color-accent-gold)]';
            case 'violet': return 'text-violet-400';
            case 'mixed': return 'bg-gradient-to-r from-[var(--color-accent-gold)] via-[var(--color-accent-primary)] to-[var(--color-accent-gold)] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x';
            default: return '';
        }
    };

    return (
        <Tag className={`${className} ${getGradientClass()}`.trim()}>
            <motion.span
                className="inline-flex flex-wrap"
                variants={containerVariants}
                initial="hidden"
                animate={animate ? "visible" : "hidden"}
            >
                {elements.map((element, index) => (
                    <motion.span
                        key={`${element}-${index}`}
                        className="inline-block whitespace-pre"
                        variants={type === 'char' ? charVariants : wordVariants}
                    >
                        {element === ' ' ? '\u00A0' : element}
                        {type === 'word' && index < elements.length - 1 && '\u00A0'}
                    </motion.span>
                ))}
            </motion.span>
        </Tag>
    );
}

/**
 * SplitText - Split headline with different styles for each line
 * Used for creative two-line headlines with contrasting styles
 */
interface SplitTextProps {
    /** First line of text */
    line1: string;
    /** Second line of text */
    line2: string;
    /** Optional third line */
    line3?: string;
    /** Additional CSS classes for the container */
    className?: string;
    /** Additional CSS classes for line 1 */
    line1ClassName?: string;
    /** Additional CSS classes for line 2 */
    line2ClassName?: string;
    /** Whether to trigger animation */
    animate?: boolean;
}

export function SplitText({
    line1,
    line2,
    line3,
    className = '',
    line1ClassName = '',
    line2ClassName = '',
    animate = true
}: SplitTextProps) {
    return (
        <div className={className}>
            {/* Line 1 - Elegant Heading */}
            <KineticText
                text={line1}
                type="char"
                as="div"
                className={`text-6xl md:text-8xl lg:text-9xl font-heading font-medium tracking-tighter leading-[0.85] text-[var(--color-text-primary)] mix-blend-difference ${line1ClassName}`.trim()}
                delay={0}
                staggerDelay={40}
                animate={animate}
            />

            {/* Line 2 - Indented/Styled */}
            <KineticText
                text={line2}
                type="char"
                as="div"
                className={`text-6xl md:text-7xl lg:text-8xl font-heading font-light italic tracking-tight leading-[0.85] text-[var(--color-text-secondary)] ml-12 md:ml-24 ${line2ClassName}`.trim()}
                delay={400} // Start after line 1 partially completes
                staggerDelay={40}
                animate={animate}
            />

            {/* Line 3 - Optional final line */}
            {line3 && (
                <KineticText
                    text={line3}
                    type="word"
                    as="div"
                    className="text-lg md:text-xl font-mono uppercase tracking-widest text-[var(--color-accent-gold)] mt-6 ml-2"
                    delay={1200}
                    staggerDelay={20}
                    animate={animate}
                />
            )}
        </div>
    );
}
