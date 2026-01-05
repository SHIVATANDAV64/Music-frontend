/**
 * Motion Presets - Nature's Intelligence
 * 
 * Philosophy: All motion in nature follows physics, not keyframes.
 * Trees sway with wind resistance. Water ripples with surface tension.
 * These presets capture organic movement patterns.
 * 
 * Based on frontend-design.md: "Motion is Meaning"
 */

import type { Transition } from 'framer-motion';

/**
 * Natural spring physics
 * Like a tree branch swaying in wind
 */
export const naturalSpring: Transition = {
    type: 'spring',
    stiffness: 50,
    damping: 20,
    mass: 1,
};

/**
 * Quick response spring
 * Like bamboo - flexible but responsive
 */
export const responsiveSpring: Transition = {
    type: 'spring',
    stiffness: 400,
    damping: 17,
    mass: 0.5,
};

/**
 * Smooth liquid transition
 * Like water finding its level
 */
export const liquidTransition: Transition = {
    type: 'spring',
    stiffness: 40,
    damping: 25,
    mass: 0.5,
};

/**
 * Breathing rhythm
 * Like slow, deep breaths - 3 seconds per cycle
 */
export const breathingTransition: Transition = {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatType: 'reverse',
};

/**
 * Organic ease curve
 * Based on CSS --ease-organic from index.css
 */
export const organicEase = [0.16, 1, 0.3, 1] as const;

/**
 * Breath ease curve  
 * Based on CSS --ease-breath from index.css
 */
export const breathEase = [0.4, 0, 0.2, 1] as const;

/**
 * Common animation variants for framer-motion
 */
export const motionVariants = {
    /**
     * Pop animation - buttons, cards
     * Scale down slightly then spring back
     */
    pop: {
        initial: { scale: 1 },
        whileTap: { scale: 0.95 },
        transition: responsiveSpring,
    },

    /**
     * Breathe animation - ambient elements
     * Gentle scale pulse, like breathing
     */
    breathe: {
        initial: { scale: 1 },
        animate: {
            scale: [1, 1.02, 1],
            transition: breathingTransition,
        },
    },

    /**
     * Ripple animation - click feedback
     * Expands and fades like water ripple
     */
    ripple: {
        initial: { scale: 1, opacity: 0.6 },
        animate: {
            scale: 1.3,
            opacity: 0,
            transition: {
                duration: 0.6,
                ease: organicEase,
            },
        },
    },

    /**
     * Float in - entrance animation
     * Elements gently float up and fade in
     */
    floatIn: {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: naturalSpring,
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: liquidTransition,
        },
    },

    /**
     * Dissolve - fade animation
     * Like morning mist dissipating
     */
    dissolve: {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.5, ease: breathEase },
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3, ease: breathEase },
        },
    },

    /**
     * Magnetic - cursor attraction
     * Element slightly moves toward cursor
     */
    magnetic: {
        whileHover: {
            scale: 1.02,
            transition: responsiveSpring,
        },
    },
};

/**
 * Physics constants for particle systems
 * Used in cymatics visualizer
 */
export const particlePhysics = {
    /** Damping factor (0-1) - how quickly particles slow down */
    damping: 0.90, // Increased responsiveness

    /** Spring stiffness for particle attraction to formation points */
    stiffness: 0.08, // Increased for snappier sync

    /** Maximum particle velocity (prevents explosion) */
    maxVelocity: 5,

    /** Minimum distance before particles repel each other */
    minDistance: 10,

    /** Repulsion force strength */
    repulsionForce: 0.3,
};

/**
 * Easing functions for canvas animations
 * Based on Robert Penner's easing equations
 */
export const easingFunctions = {
    /** Ease in-out cubic - smooth acceleration and deceleration */
    easeInOutCubic: (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /** Ease out elastic - bouncy ending like guitar string */
    easeOutElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    /** Ease in-out sine - gentle wave motion */
    easeInOutSine: (t: number): number => {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    },
};
