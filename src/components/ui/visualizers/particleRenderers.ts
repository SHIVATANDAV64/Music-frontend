import { particlePhysics } from '../../../lib/motion';

export type VisualizerMode = 'chladni' | 'water' | 'sacred' | 'turing' | 'voronoi' | 'hopf';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetX: number;
    targetY: number;
    life: number;
}

export interface ParticleUpdateParams {
    particle: Particle;
    index: number;
    totalParticles: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    mode: VisualizerMode;
    audioData: {
        bassEnergy: number;
        midEnergy: number;
        trebleEnergy: number;
        volume: number;
    };
    time: number;
    deltaTime: number;
}

export function updateParticle(params: ParticleUpdateParams) {
    const {
        particle,
        index,
        totalParticles,
        width,
        centerX,
        centerY,
        mode,
        audioData,
        time,
        deltaTime
    } = params;

    const { bassEnergy, midEnergy, trebleEnergy, volume } = audioData;

    // --- 1. Calculate Target Position based on Mode ---
    let targetX = centerX;
    let targetY = centerY;

    if (mode === 'chladni') {
        const angle = (index / totalParticles) * Math.PI * 2;
        const radius = (bassEnergy * (width * 0.2)) + (midEnergy * (width * 0.1));
        const harmonicOffset = Math.sin(angle * 4) * trebleEnergy * (width * 0.1);

        targetX = centerX + Math.cos(angle) * (radius + harmonicOffset);
        targetY = centerY + Math.sin(angle) * (radius + harmonicOffset) * 0.6;

    } else if (mode === 'water') {
        const angle = (index / totalParticles) * Math.PI * 2;
        const ring = Math.floor(index / (totalParticles / 5));
        const baseRadius = ring * (width * 0.08);
        const pulse = Math.sin(time * 0.003 + ring) * bassEnergy * (width * 0.05);
        const rippleRadius = baseRadius + pulse;

        targetX = centerX + Math.cos(angle) * rippleRadius;
        targetY = centerY + Math.sin(angle) * rippleRadius;

    } else if (mode === 'sacred') {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = index * goldenAngle;
        const radius = Math.sqrt(index) * (5 + midEnergy * (width * 0.02));
        const spiralTightness = 1 + trebleEnergy * 2;

        targetX = centerX + Math.cos(angle * spiralTightness) * radius;
        targetY = centerY + Math.sin(angle * spiralTightness) * radius;

    } else if (mode === 'turing') {
        const timePhase = time * 0.002;
        const killEffect = bassEnergy;
        const feedEffect = midEnergy;
        const diffusionWobble = trebleEnergy * 30;

        const wormSize = Math.max(8, Math.floor(20 - volume * 12));
        const wormIndex = Math.floor(index / wormSize);
        const wormPosition = index % wormSize;
        const totalWorms = Math.ceil(totalParticles / wormSize);

        const wormAngle = (wormIndex / totalWorms) * Math.PI * 2
            + timePhase * (1 + bassEnergy * 3);

        const baseRadius = width * 0.2;
        const audioRadius = baseRadius + (bassEnergy * width * 0.25) + (midEnergy * width * 0.15);
        const wormRadius = audioRadius + Math.sin(timePhase * 2 + wormIndex) * (width * 0.1) * (1 + volume);

        const fragmentAngle = killEffect * Math.sin(index * 0.5 + timePhase * 5) * Math.PI * 0.5;
        const fragmentDist = killEffect * Math.sin(index * 2 + timePhase * 3) * (width * 0.15);

        const spineX = centerX + Math.cos(wormAngle + fragmentAngle) * (wormRadius + fragmentDist);
        const spineY = centerY + Math.sin(wormAngle + fragmentAngle) * (wormRadius + fragmentDist);

        const perpAngle = wormAngle + Math.PI / 2;
        const baseSpread = (wormPosition - wormSize / 2) * (4 + feedEffect * 6);
        const wobble = Math.sin(time * 0.01 + index * 0.3) * diffusionWobble;

        targetX = spineX + Math.cos(perpAngle) * baseSpread + wobble;
        targetY = spineY + Math.sin(perpAngle) * baseSpread * 0.8 + wobble * 0.5;

    } else if (mode === 'voronoi') {
        const timePhase = time * 0.001;
        const gridSize = Math.ceil(Math.sqrt(totalParticles));
        const gridX = index % gridSize;
        const gridY = Math.floor(index / gridSize);

        const cellWidth = width / gridSize;
        // Assuming square-ish cells or proportional height if passed, but simplifying here
        // We'll use width-based scaling for uniform grid or strict height if available
        // For particle physics often better to keep relative to width/center
        const height = params.height;
        const cellHeight = height / gridSize;

        const baseX = (gridX + 0.5) * cellWidth;
        const baseY = (gridY + 0.5) * cellHeight;

        const dxFromCenter = baseX - centerX;
        const dyFromCenter = baseY - centerY;
        const distFromCenter = Math.sqrt(dxFromCenter * dxFromCenter + dyFromCenter * dyFromCenter) || 1;

        const breathForce = (bassEnergy * 1.5 + volume * 0.8);
        const breathX = (dxFromCenter / distFromCenter) * breathForce * (width * 0.3);
        const breathY = (dyFromCenter / distFromCenter) * breathForce * (height * 0.3);

        const wobbleX = Math.sin(timePhase * 3 + gridX * 0.5 + gridY * 0.3) * midEnergy * 40;
        const wobbleY = Math.cos(timePhase * 3 + gridX * 0.3 + gridY * 0.5) * midEnergy * 40;

        const shimmerX = Math.sin(time * 0.02 + index * 0.1) * trebleEnergy * 20;
        const shimmerY = Math.cos(time * 0.02 + index * 0.07) * trebleEnergy * 20;

        targetX = baseX + breathX + wobbleX + shimmerX;
        targetY = baseY + breathY + wobbleY + shimmerY;

    } else if (mode === 'hopf') {
        const timePhase = time * 0.002;
        const torusCount = 6;
        const particlesPerTorus = Math.ceil(totalParticles / torusCount);
        const torusIndex = Math.floor(index / particlesPerTorus);
        const posOnTorus = (index % particlesPerTorus) / particlesPerTorus;

        const baseTorusRadius = (width * 0.06) + torusIndex * (width * 0.05);
        const torusRadius = baseTorusRadius + (bassEnergy * width * 0.08);

        const baseTubeRadius = (width * 0.02) + torusIndex * (width * 0.008);
        const tubeRadius = baseTubeRadius + (volume * width * 0.015);

        const baseSpeed = timePhase * 2;
        let rotationSpeed: number;
        let tubeRotation: number;

        if (torusIndex < 2) {
            rotationSpeed = baseSpeed * (3 + trebleEnergy * 8);
            tubeRotation = baseSpeed * (5 + trebleEnergy * 10);
        } else if (torusIndex < 4) {
            rotationSpeed = baseSpeed * (2 + midEnergy * 5);
            tubeRotation = baseSpeed * (3 + midEnergy * 6);
        } else {
            rotationSpeed = baseSpeed * (1 + bassEnergy * 4);
            tubeRotation = baseSpeed * (2 + bassEnergy * 5);
        }

        const u = posOnTorus * Math.PI * 2 + rotationSpeed;
        const v = posOnTorus * (torusIndex + 1) * Math.PI * 2 + tubeRotation;

        const x3d = (torusRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y3d = (torusRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
        const z3d = tubeRadius * Math.sin(v);

        const perspective = 1 + z3d / (width * 0.5);
        targetX = centerX + x3d * perspective;
        targetY = centerY + y3d * perspective * 0.7;

        const pulseStrength = (bassEnergy * 25) + (volume * 15);
        targetX += Math.sin(v * 4 + timePhase * 8) * pulseStrength;
        targetY += Math.cos(v * 4 + timePhase * 8) * pulseStrength * 0.5;
    }

    particle.targetX = targetX;
    particle.targetY = targetY;

    // --- 2. Physics Update ---
    const dx = targetX - particle.x;
    const dy = targetY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
        const force = distance * particlePhysics.stiffness;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
    }

    particle.vx *= particlePhysics.damping;
    particle.vy *= particlePhysics.damping;

    const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
    if (speed > particlePhysics.maxVelocity) {
        particle.vx = (particle.vx / speed) * particlePhysics.maxVelocity;
        particle.vy = (particle.vy / speed) * particlePhysics.maxVelocity;
    }

    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;

    // --- 3. Life Cycle ---
    if (particle.life < 1) {
        particle.life = Math.min(1, particle.life + 0.02 * deltaTime);
    }
}

export function getParticleColor(mode: VisualizerMode, audioData: { bass: number, mid: number, treble: number }): string {
    const { bass, mid, treble } = audioData;
    let r, g, b;

    if (mode === 'chladni') { r = 212; g = 175; b = 55; }
    else if (mode === 'water') { r = 100 + (treble * 100); g = 149 + (mid * 50); b = 237; }
    else if (mode === 'sacred') { r = 230; g = 230; b = 230; }
    else if (mode === 'turing') { r = 50 + (bass * 50); g = 200 + (mid * 55); b = 180 + (treble * 75); }
    else if (mode === 'voronoi') { r = 200 + (mid * 55); g = 140 + (bass * 50); b = 80 + (treble * 40); }
    else { r = 180 + (bass * 75); g = 100 + (mid * 50); b = 220 + (treble * 35); }

    return `${r}, ${g}, ${b}`;
}
