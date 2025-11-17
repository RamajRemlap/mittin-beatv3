import React from 'react';
import { useStore } from '../store/useStore';

export default function KitSelector() {
  const soundKits = useStore(state => state.soundKits);
  const activeKitId = useStore(state => state.activeKitId);
  const setSoundKit = useStore(state => state.setSoundKit);

  return (
    <div className="mb-4">
      <label htmlFor="kit-selector" className="block text-sm font-medium text-gray-400 mb-2">Sound Kit</label>
      <select
        id="kit-selector"
        value={activeKitId}
        onChange={(e) => setSoundKit(e.target.value)}
        className="w-full bg-gray-700 text-white text-sm rounded border border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 px-2 py-1.5"
      >
        {soundKits.map(kit => (
          <option key={kit.id} value={kit.id}>
            {kit.name}
          </option>
        ))}
      </select>
    </div>
  );
}