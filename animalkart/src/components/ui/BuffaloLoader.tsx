import React from 'react';

export default function BuffaloLoader() {
  return (
    <div className="relative w-full max-w-2xl h-72 bg-[#5bc9f4] rounded-2xl border-4 border-[#1b3625] overflow-hidden shadow-lg mx-auto mb-8 flex flex-col items-center justify-end pb-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        @keyframes buffalo-run {
            from { background-position: 0 0; }
            to { background-position: -1024px 0; }
        }
        .pixel-font {
          font-family: 'Press Start 2P', cursive;
        }
        .buffalo-sprite {
            background-image: url("/buffalo-sprite.png");
            width: 204.8px;
            height: 585px;
            background-size: 1024px 585px;
            background-repeat: no-repeat;
            animation: buffalo-run 0.5s steps(5) infinite;
            transform: scale(0.35);
            transform-origin: bottom center;
            margin-bottom: -15px;
            z-index: 10;
        }
      `}</style>
      
      <div className="buffalo-sprite"></div>

      <div className="z-20 mt-4">
        <h2 className="text-[#3b4043] pixel-font text-lg md:text-xl drop-shadow-sm font-bold">LOADING...</h2>
      </div>
    </div>
  );
}
