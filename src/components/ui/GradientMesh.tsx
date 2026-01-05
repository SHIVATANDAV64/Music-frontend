/**
 * Gradient Mesh Background - SIMPLIFIED
 * 
 * Pure CSS gradient with minimal CSS keyframe animation.
 * No JavaScript, no Framer Motion - just subtle ambient glow.
 */

export function GradientMesh() {
    return (
        <div className="gradient-mesh">
            {/* Static ambient gradient using CSS only */}
            <div
                className="absolute inset-0 animate-subtle-glow"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 30%, rgba(201, 169, 98, 0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(201, 169, 98, 0.05) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0) 0%, var(--bg-deep) 70%)
                    `,
                }}
            />
        </div>
    );
}
