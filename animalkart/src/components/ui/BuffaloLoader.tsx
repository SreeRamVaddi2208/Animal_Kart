import React from 'react';

export default function BuffaloLoader() {
  return (
    <div className="relative w-full max-w-2xl h-64 bg-[#030a06] rounded-2xl border-4 border-[#1b3625] overflow-hidden shadow-lg mx-auto mb-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        @keyframes scroll-ground {
            from { background-position: 0 0; }
            to { background-position: -200px 0; }
        }
        @keyframes buffalo-run {
            from { background-position: 0 0; }
            to { background-position: -1024px 0; }
        }
        .pixel-font {
          font-family: 'Press Start 2P', cursive;
        }
        .ground-texture {
            background-image: linear-gradient(to bottom, #0a1811 0%, #030a06 100%);
            height: 60px;
            width: 100%;
            position: absolute;
            bottom: 0;
            left: 0;
            animation: scroll-ground 0.5s linear infinite;
            z-index: 1;
            border-top: 4px solid #10b981;
        }
        .buffalo-sprite {
            background-image: url("/buffalo-sprite.png");
            width: 204.8px;
            height: 585px;
            background-size: 1024px 585px;
            background-repeat: no-repeat;
            animation: buffalo-run 0.5s steps(5) infinite;
            position: absolute;
            bottom: 5px;
            left: 50%;
            margin-left: -102.4px;
            transform: scale(0.35);
            transform-origin: bottom center;
            z-index: 10;
        }
      `}</style>
      
      <div className="absolute inset-x-0 top-8 text-center z-20">
        <h2 className="text-[#10b981] pixel-font text-lg md:text-xl drop-shadow-[0_0px_8px_rgba(16,185,129,0.4)]">LOADING ODOO DATA...</h2>
        <p className="text-[#10b981]/70 pixel-font mt-4 text-[10px] animate-pulse uppercase tracking-wider">Running to fetch your livestock...</p>
      </div>
      
      <div className="buffalo-sprite"></div>

      <div className="ground-texture"></div>
    </div>
  );
}
