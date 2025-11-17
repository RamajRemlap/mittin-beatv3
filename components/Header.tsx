
import React from 'react';

export default function Header() {
  return (
    <header className="bg-gray-950/50 backdrop-blur-sm border-b border-gray-700/50 p-4 flex items-center justify-between sticky top-0 z-20">
      <h1 className="text-2xl font-bold tracking-tighter text-white">
        Mitten<span className="text-cyan-400">Beats</span>
      </h1>
      <div className="text-sm text-gray-400">Detroit/Flint Beat Maker</div>
    </header>
  );
}
