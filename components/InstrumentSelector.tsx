import React from 'react';
import { useStore } from '../store/useStore';

interface InstrumentSelectorProps {
  trackIndex: number;
}

export default function InstrumentSelector({ trackIndex }: InstrumentSelectorProps) {
  const track = useStore(state => state.tracks[trackIndex]);
  const setTrackInstrument = useStore(state => state.setTrackInstrument);

  if (!track || track.instruments.length <= 1) {
    return null;
  }

  return (
    <div className="mb-1">
      <select
        value={track.activeInstrumentId}
        onChange={(e) => setTrackInstrument(trackIndex, e.target.value)}
        className="w-full bg-gray-700 text-white text-xs rounded border border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 px-2 py-1"
        aria-label={`Select instrument for ${track.name}`}
      >
        {track.instruments.map(instrument => (
          <option key={instrument.id} value={instrument.id}>
            {instrument.name}
          </option>
        ))}
      </select>
    </div>
  );
}