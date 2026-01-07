

export const MeshGradient = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-void">
            <div className="absolute top-[-20%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-neon-primary opacity-20 blur-[120px] animate-pulse-slow mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-neon-secondary opacity-20 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen" />
            <div className="absolute top-[40%] left-[30%] h-[40vh] w-[40vw] rounded-full bg-purple-900 opacity-20 blur-[100px] animate-pulse-slow delay-2000 mix-blend-screen" />

            {/* Floating particles */}
            <div className="absolute inset-0 z-10 opacity-30">
                <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black" />
            </div>
        </div>
    );
};
