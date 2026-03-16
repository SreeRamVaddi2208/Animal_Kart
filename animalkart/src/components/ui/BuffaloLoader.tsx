import React, { useEffect, useState } from 'react';

export default function BuffaloLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Add a simple animation to the progress bar for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col min-h-screen bg-[#03110e] text-[#dff2ec] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .loader-font-body { font-family: 'Manrope', sans-serif; }
        .headline-font { font-family: 'Space Grotesk', sans-serif; }
        .label-style { 
            font-family: 'Space Grotesk', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(19, 42, 37, 0.6);
        }
        .glow-edge {
            box-shadow: 0 0 15px rgba(158, 255, 200, 0.4);
        }
      `}</style>
      
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between px-8 py-6 loader-font-body">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#9effc8] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#00643e] text-xl">pets</span>
          </div>
          <span className="headline-font font-bold text-xl tracking-tight">MURRAH TECH</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#9dafa9]">account_circle</span>
        </div>
      </header>

      {/* Main Loading Canvas */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden loader-font-body animate-in fade-in duration-500">
        {/* Background Atmospheric Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9effc8]/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl w-full z-10 flex flex-col items-center">
          {/* Hero Animation Container */}
          <div className="w-full aspect-[21/9] rounded-xl overflow-hidden mb-12 bg-[#0e231f] relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#03110e] via-transparent to-transparent z-10 opacity-60"></div>
            <img 
              className="w-full h-full object-cover animate-pulse" 
              style={{ animationDuration: '3s' }}
              alt="Pixel art buffaloes running across a grassy field" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuSG73dyqZm0TZhXDnocBXnXivCFCWyXskc4p3pZpGxvPzJbmt6FR9iZ1YDEq--1JCfaS6Tm1kO_CEqMHc75y--qzDzx76cTg5eO1wQAswRiy5T1fJtwyKAy7ZIaNpHXOF97qxXBxeHAjxT0OfYHnhaOcyS051cfa1hC7h_68zsIWE0j_GhSBP_DMhXmR0eTS5mdRIyXNGn7nbBvFK6aXGFWb6JV1f38rHsP4H1uSd7fH26bqK87AvWbInf2LV_MHr4lhWCD7BL6wO"
            />
            {/* Overlay Data Badge */}
            <div className="absolute top-6 left-6 z-20 flex gap-4">
              <div className="glass-effect px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9effc8] animate-pulse"></span>
                <span className="label-style text-[10px] font-bold text-[#9effc8]">Live Syncing</span>
              </div>
            </div>
          </div>
          
          {/* Loading Interface Card */}
          <div className="w-full max-w-2xl bg-[#0e231f]/80 p-10 rounded-xl border border-[#3b4b47]/15 relative overflow-hidden">
            <div className="flex justify-between items-end mb-8">
              <div className="space-y-1">
                <span className="label-style text-xs text-[#00ec9a] animate-pulse">System Initializing</span>
                <h1 className="headline-font text-4xl font-light tracking-tight">Connecting to <span className="text-[#9effc8] font-bold">AnimalKart</span></h1>
              </div>
              <div className="text-right">
                <span className="headline-font text-5xl font-bold text-[#9effc8]">{progress}%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="label-style text-[11px] text-[#9dafa9]">Loading Herd Data...</span>
                <span className="label-style text-[11px] text-[#9effc8]">Active Node: BIOSENSOR_04</span>
              </div>
              <div className="h-3 w-full bg-[#132a25] rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-[#9effc8] to-[#62fccb] rounded-full relative glow-edge transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm rounded-full"></div>
                </div>
              </div>
              <div className="pt-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#84ecff] animate-bounce">monitoring</span>
                <p className="text-xs text-[#9dafa9] font-medium">Connecting to Murrah Biosensors across northern territories...</p>
              </div>
            </div>
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-4 mt-10">
              <div className="bg-[#051613] p-4 rounded-lg">
                <span className="label-style text-[9px] text-[#9dafa9] block mb-1">Sat Link</span>
                <span className="headline-font text-sm text-[#62fccb]">STABLE</span>
              </div>
              <div className="bg-[#051613] p-4 rounded-lg">
                <span className="label-style text-[9px] text-[#9dafa9] block mb-1">Latency</span>
                <span className="headline-font text-sm text-[#62fccb]">24ms</span>
              </div>
              <div className="bg-[#051613] p-4 rounded-lg">
                <span className="label-style text-[9px] text-[#9dafa9] block mb-1">Encryption</span>
                <span className="headline-font text-sm text-[#62fccb] font-bold">AES-256</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Interface Bar */}
      <footer className="bg-[#051613] px-8 py-4 border-t border-[#3b4b47]/10 loader-font-body mt-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex gap-12">
            <div className="flex items-center gap-3 opacity-30">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="label-style text-xs font-bold hidden sm:inline-block">Dashboard</span>
            </div>
            <div className="flex items-center gap-3 opacity-30">
              <span className="material-symbols-outlined">pets</span>
              <span className="label-style text-xs font-bold hidden sm:inline-block">Livestock</span>
            </div>
            <div className="flex items-center gap-3 text-[#9effc8]">
              <span className="material-symbols-outlined animate-pulse">monitoring</span>
              <span className="label-style text-xs font-bold hidden sm:inline-block">Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-[#3b4b47]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#9effc8] w-1/3"></div>
            </div>
            <span className="label-style text-[10px] text-[#9dafa9]">Version 4.2.0-Alpha</span>
          </div>
        </div>
      </footer>

      {/* Interactive Elements */}
      <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 flex flex-col gap-4">
        <button className="w-14 h-14 rounded-xl bg-[#9effc8] flex items-center justify-center shadow-lg hover:bg-[#00ec9a] transition-colors hover:scale-105 active:scale-95 duration-200">
          <span className="material-symbols-outlined text-[#00643e]">support_agent</span>
        </button>
      </div>
    </div>
  );
}
