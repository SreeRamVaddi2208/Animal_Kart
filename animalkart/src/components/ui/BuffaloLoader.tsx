import React from 'react';

export default function BuffaloLoader() {
  return (
    <div className="flex flex-col items-center justify-center w-full relative overflow-hidden rounded-2xl bg-[#030a06] h-[240px] border border-[#1b3625] mb-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        @keyframes scroll-ground {
            from { background-position: 0 0; }
            to { background-position: -400px 0; }
        }
        @keyframes buffalo-run {
            from { background-position: 0 0; }
            to { background-position: -1024px 0; } /* 1024px width */
        }
        .pixel-font {
          font-family: 'Press Start 2P', cursive;
        }
        .ground-texture {
            background-image: linear-gradient(to bottom, #0a1811 0%, #030a06 100%);
            height: 48px;
            width: 200%;
            position: absolute;
            bottom: 0;
            left: 0;
            animation: scroll-ground 1.5s linear infinite;
            z-index: 1;
            border-top: 4px solid #1b3625;
        }
        .buffalo-sprite {
            background-image: url("/buffalo-sprite.png");
            width: 204.8px; /* 1024px / 5 frames */
            height: 585px; /* height of original image */
            background-size: 1024px 585px;
            background-repeat: no-repeat;
            animation: buffalo-run 0.6s steps(5) infinite;
            position: absolute;
            bottom: 30px; /* Above ground */
            z-index: 10;
            transform: scale(0.25);
            transform-origin: bottom center;
        }
      `}</style>
      
      <div className="absolute top-8 text-[#10b981] pixel-font text-lg text-center z-20 drop-shadow-[0_0px_8px_rgba(16,185,129,0.4)]">
        LOADING ODOO DATA...
      </div>
      
      <div className="buffalo-sprite"></div>

      <div className="ground-texture"></div>
    </div>
  );
}
