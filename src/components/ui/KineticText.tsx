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
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
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
        y: 50,
        rotateX: -90,
        filter: 'blur(10px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
        },
    },
};

const wordVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
        },
    },
};

export function KineticText({
    text,
    type = 'char',
    as: Tag = 'h1',
    className = '',
    delay = 0,
    staggerDelay = 40,
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
            case 'gold': return 'text-gold-gradient';
            case 'violet': return 'text-violet-gradient';
            case 'mixed': return 'bg-gradient-to-r from-[var(--accent)] via-[var(--violet)] to-[var(--accent-light)] bg-clip-text text-transparent';
            default: return '';
        }
    };

    return (
        <Tag className={`${className} ${getGradientClass()}`}>
            <motion.span
                className="inline-flex flex-wrap"
                style={{ perspective: '1000px' }}
                variants={containerVariants}
                initial="hidden"
                animate={animate ? "visible" : "hidden"}
            >
                {elements.map((element, index) => (
                    <motion.span
                        key={`${element}-${index}`}
                        className="inline-block"
                        style={{ transformStyle: 'preserve-3d' }}
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
    /** Additional CSS classes */
    className?: string;
    /** Whether to trigger animation */
    animate?: boolean;
}

export function SplitText({
    line1,
    line2,
    line3,
    className = '',
    animate = true
}: SplitTextProps) {
    return (
        <div className={className}>
            {/* Line 1 - Elegant serif */}
            <KineticText
                text={line1}
                type="char"
                as="span"
                className="block text-5xl lg:text-7xl font-bold font-[var(--font-display)]"
                delay={0}
                staggerDelay={30}
                animate={animate}
            />

            {/* Line 2 - Gradient accent */}
            <KineticText
                text={line2}
                type="char"
                as="span"
                className="block text-5xl lg:text-7xl font-bold"
                gradient="mixed"
                delay={300}
                staggerDelay={30}
                animate={animate}
            />

            {/* Line 3 - Optional final line */}
            {line3 && (
                <KineticText
                    text={line3}
                    type="word"
                    as="span"
                    className="block text-5xl lg:text-7xl font-bold"
                    delay={600}
                    staggerDelay={100}
                    animate={animate}
                />
            )}
        </div>
    );
}
