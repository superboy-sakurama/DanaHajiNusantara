import React, { useState, useEffect } from 'react';

interface Kabah4DSceneProps {
  size?: 'compact' | 'large';
  interactive?: boolean;
}

export const Kabah4DScene: React.FC<Kabah4DSceneProps> = ({
  size = 'compact',
  interactive = true,
}) => {
  const isLarge = size === 'large';
  const [rotateOffset, setRotateOffset] = useState({ x: -12, y: 28 });
  const [isHovered, setIsHovered] = useState(false);

  // Gentle idle floating animation
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.02;
      if (!isHovered) {
        setRotateOffset({
          x: -12 + Math.sin(t * 0.7) * 3,
          y: 28 + Math.cos(t * 0.5) * 5,
        });
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateOffset({
      x: -12 - y * 24,
      y: 28 + x * 36,
    });
  };

  const cubeSize = isLarge ? 130 : 80;
  const halfCube = cubeSize / 2;

  return (
    <div
      className={`relative select-none flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isLarge ? 'h-64 sm:h-72 w-full' : 'h-40 sm:h-44 w-full'
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient Celestial Glow (Purple-Pink Halo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`rounded-full bg-gradient-to-tr from-fuchsia-600/30 via-pink-500/20 to-amber-400/20 blur-3xl ${
            isLarge ? 'w-64 h-64' : 'w-40 h-40'
          }`}
        />
        {/* Golden Divine Rays */}
        <div
          className="absolute w-48 h-48 rounded-full border border-amber-300/20 animate-ping opacity-25"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute w-72 h-72 rounded-full border border-fuchsia-400/15 animate-spin"
          style={{ animationDuration: '30s' }}
        />
      </div>

      {/* Floating Sparkles / Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-4 left-1/4 text-amber-300/70 text-xs animate-pulse">✦</span>
        <span className="absolute top-8 right-1/4 text-pink-300/80 text-sm animate-bounce" style={{ animationDuration: '3s' }}>★</span>
        <span className="absolute bottom-6 left-1/3 text-fuchsia-200/60 text-xs animate-ping" style={{ animationDuration: '5s' }}>✦</span>
        <span className="absolute top-12 right-12 text-amber-200/90 text-xs">✨</span>
        <span className="absolute bottom-10 right-1/4 text-pink-300/70 text-xs animate-pulse">✦</span>
      </div>

      {/* Crescent Moon Badge */}
      <div className="absolute top-2 right-4 sm:right-8 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-amber-200 shadow-sm pointer-events-none">
        <span className="text-amber-300">🌙</span>
        <span className="font-semibold tracking-wider uppercase text-[10px]">Makkah Al-Mukarramah</span>
      </div>

      {/* 3D Scene Viewport */}
      <div
        className="relative perspective-1000 flex items-center justify-center"
        style={{
          perspective: '1200px',
        }}
      >
        {/* Tawaf Orbit Rings (White/Gold dots circling the Ka'bah) */}
        <div
          className={`absolute rounded-full border border-dashed border-amber-400/25 pointer-events-none ${
            isLarge ? 'w-60 h-60' : 'w-44 h-44'
          }`}
          style={{
            transform: 'rotateX(72deg) rotateZ(0deg)',
            animation: 'spin 18s linear infinite',
          }}
        >
          {/* Luminous pilgrims orbiting in Tawaf */}
          <div className="absolute -top-1.5 left-1/2 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]" />
          <div className="absolute top-1/2 -left-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          <div className="absolute bottom-2 right-1/4 w-2 h-2 rounded-full bg-pink-300 shadow-[0_0_8px_#f472b6]" />
        </div>

        <div
          className={`absolute rounded-full border border-dotted border-pink-400/20 pointer-events-none ${
            isLarge ? 'w-72 h-72' : 'w-52 h-52'
          }`}
          style={{
            transform: 'rotateX(72deg) rotateZ(45deg)',
            animation: 'spin 26s linear infinite reverse',
          }}
        >
          <div className="absolute top-4 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_5px_#fef08a]" />
          <div className="absolute -bottom-1 left-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        </div>

        {/* Marble Courtyard / Mataf Base (Pavement) */}
        <div
          className="absolute rounded-full bg-gradient-to-tr from-slate-200/20 via-white/30 to-amber-100/20 shadow-2xl backdrop-blur-sm pointer-events-none"
          style={{
            width: isLarge ? '200px' : '140px',
            height: isLarge ? '200px' : '140px',
            transform: 'rotateX(72deg) translateZ(-40px)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
          }}
        />

        {/* 3D Ka'bah Container */}
        <div
          className="relative transform-style-3d transition-transform duration-150 ease-out"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateX(${rotateOffset.x}deg) rotateY(${rotateOffset.y}deg)`,
          }}
        >
          {/* FRONT FACE (With Golden Kiswah & Door of Ka'bah) */}
          <div
            className="absolute inset-0 bg-[#0c0c12] border border-amber-500/40 rounded-sm flex flex-col justify-between p-1.5 shadow-2xl"
            style={{
              transform: `translateZ(${halfCube}px)`,
              background: 'linear-gradient(135deg, #181824 0%, #0d0d14 50%, #050508 100%)',
            }}
          >
            {/* Kiswah Gold Band (Hizam) */}
            <div className="w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 h-3.5 rounded-xs flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.5)] border border-amber-200">
              <span className="text-[7px] text-amber-950 font-bold tracking-widest font-mono">
                ﷽
              </span>
            </div>

            {/* Bab Al-Ka'bah (Golden Door) */}
            <div className="self-end mr-1 mb-0.5 w-6 h-11 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border border-amber-100 rounded-t-sm shadow-[0_0_8px_rgba(245,158,11,0.6)] flex flex-col items-center justify-around py-0.5">
              <div className="w-4 h-0.5 bg-amber-800 rounded-full opacity-60" />
              <div className="w-3.5 h-3.5 border border-amber-800/60 rounded-xs flex items-center justify-center">
                <span className="text-[6px] text-amber-950 font-bold">الله</span>
              </div>
              <div className="w-4 h-0.5 bg-amber-800 rounded-full opacity-60" />
            </div>

            {/* Base Shadirwan (Marble ledge) */}
            <div className="w-full h-1 bg-gradient-to-r from-slate-200 via-white to-slate-200 rounded-xs opacity-90 shadow-sm" />
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 bg-[#09090f] border border-amber-500/20 rounded-sm flex flex-col justify-between p-1.5"
            style={{
              transform: `rotateY(180deg) translateZ(${halfCube}px)`,
              background: 'linear-gradient(135deg, #12121a 0%, #07070b 100%)',
            }}
          >
            <div className="w-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 h-3.5 rounded-xs opacity-80" />
            <div className="w-full h-1 bg-slate-300 rounded-xs opacity-75" />
          </div>

          {/* RIGHT FACE (With Hajar Al-Aswad Silver Corner) */}
          <div
            className="absolute inset-0 bg-[#0e0e16] border border-amber-500/30 rounded-sm flex flex-col justify-between p-1.5"
            style={{
              transform: `rotateY(90deg) translateZ(${halfCube}px)`,
              background: 'linear-gradient(135deg, #1c1c28 0%, #0b0b12 100%)',
            }}
          >
            <div className="w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 h-3.5 rounded-xs flex items-center justify-center">
              <span className="text-[6px] text-amber-950 font-mono font-semibold">لَا إِلٰهَ إِلَّا ٱللَّٰهُ</span>
            </div>

            {/* Corner casing */}
            <div className="flex justify-start">
              <div
                className="w-3 h-3 rounded-full bg-gradient-to-tr from-slate-400 via-slate-100 to-white border border-slate-300 shadow-[0_0_6px_#cbd5e1] flex items-center justify-center"
                title="Hajar Al-Aswad"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-black" />
              </div>
            </div>

            <div className="w-full h-1 bg-slate-200 rounded-xs opacity-90" />
          </div>

          {/* LEFT FACE */}
          <div
            className="absolute inset-0 bg-[#0a0a10] border border-amber-500/20 rounded-sm flex flex-col justify-between p-1.5"
            style={{
              transform: `rotateY(-90deg) translateZ(${halfCube}px)`,
              background: 'linear-gradient(135deg, #14141e 0%, #08080c 100%)',
            }}
          >
            <div className="w-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 h-3.5 rounded-xs" />
            <div className="w-full h-1 bg-slate-300 rounded-xs opacity-75" />
          </div>

          {/* TOP FACE (Roof of Ka'bah) */}
          <div
            className="absolute inset-0 bg-[#0a0a0f] border border-amber-500/40 rounded-sm flex items-center justify-center"
            style={{
              transform: `rotateX(90deg) translateZ(${halfCube}px)`,
              background: 'radial-gradient(circle, #252538 0%, #09090e 100%)',
            }}
          >
            <div className="w-3/4 h-3/4 border border-dashed border-amber-400/30 rounded-xs flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400/50 blur-[1px]" />
            </div>
          </div>

          {/* BOTTOM FACE (Base) */}
          <div
            className="absolute inset-0 bg-black/80 rounded-sm shadow-2xl"
            style={{
              transform: `rotateX(-90deg) translateZ(${halfCube}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
