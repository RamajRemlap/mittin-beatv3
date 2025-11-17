import React from 'react';
import { useStore } from '../store/useStore';
import { MuteIcon, SoloIcon, VolumeIcon } from './Icons';
import KitSelector from './KitSelector';
import InstrumentSelector from './InstrumentSelector';

export default function Mixer() {
  const tracks = useStore(state => state.tracks);
  const setTrackVolume = useStore(state => state.setTrackVolume);
  const toggleTrackMute = useStore(state => state.toggleTrackMute);
  const toggleTrackSolo = useStore(state => state.toggleTrackSolo);
  
  const hasSolo = tracks.some(t => t.solo);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-2 text-gray-300">Mixer</h2>
      <KitSelector />
      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div key={track.id}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${track.mute || (hasSolo && !track.solo) ? 'text-gray-500' : 'text-gray-200'}`}>{track.name}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleTrackMute(index)}
                  className={`p-1 rounded ${track.mute ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                    <MuteIcon className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => toggleTrackSolo(index)}
                  className={`p-1 rounded ${track.solo ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                    <SoloIcon className="w-4 h-4"/>
                </button>
              </div>
            </div>
            {track.instruments.length > 1 && (
                <InstrumentSelector trackIndex={index} />
            )}
            <div className="flex items-center gap-2 mt-2">
              <VolumeIcon className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={track.volume}
                onChange={(e) => setTrackVolume(index, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}