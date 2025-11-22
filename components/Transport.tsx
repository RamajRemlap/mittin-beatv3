import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PlayIcon, PauseIcon, TrashIcon, SparklesIcon } from './Icons';
import { BeatStyle } from '../types';

export default function Transport() {
  const isPlaying = useStore(state => state.isPlaying);
  const tempo = useStore(state => state.tempo);
  const swing = useStore(state => state.swing);
  const activeSectionId = useStore(state => state.activeSectionId);
  const sections = useStore(state => state.sections);
  const presets = useStore(state => state.presets);
  const isExporting = useStore(state => state.isExporting);

  const togglePlayback = useStore(state => state.togglePlayback);
  const setTempo = useStore(state => state.setTempo);
  const setSwing = useStore(state => state.setSwing);
  const clearActivePattern = useStore(state => state.clearActivePattern);
  const applyPreset = useStore(state => state.applyPreset);
  const setSectionBars = useStore(state => state.setSectionBars);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [songName, setSongName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<BeatStyle>('DETROIT');

  const activeSection = activeSectionId ? sections[activeSectionId] : null;
  const bars = activeSection?.bars ?? 4;

  const handleSaveToPlaylist = () => {
    if (!songName.trim()) {
      alert('Please enter a song name');
      return;
    }
    const exportFn = (window as any).__mittenBeatsExport;
    if (exportFn) {
      exportFn(songName.trim(), selectedStyle);
      setShowSaveModal(false);
      setSongName('');
    }
  };

  return (
    <footer className="bg-gray-950/70 backdrop-blur-sm border-t border-gray-700/50 p-3 sm:p-4 sticky bottom-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayback}
            className="p-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Tempo, Bars, Swing */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <label htmlFor="tempo" className="text-xs text-gray-400 mb-1">TEMPO</label>
            <input
              id="tempo"
              type="number"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-20 bg-gray-800 text-center text-lg font-mono rounded border border-gray-700 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-col items-center">
            <label htmlFor="bars" className="text-xs text-gray-400 mb-1">BARS</label>
            <select
              id="bars"
              value={bars}
              onChange={(e) => activeSectionId && setSectionBars(activeSectionId, Number(e.target.value))}
              className="w-16 bg-gray-800 text-center text-lg font-mono rounded border border-gray-700 focus:ring-cyan-500 focus:border-cyan-500"
              disabled={!activeSectionId}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </div>
          <div className="flex flex-col items-center">
            <label htmlFor="swing" className="text-xs text-gray-400 mb-1">SWING</label>
            <input
              id="swing"
              type="range"
              min="0.5"
              max="0.75"
              step="0.01"
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>

        {/* Pattern Controls */}
        <div className="flex items-center gap-2">
           <div className="relative group">
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <SparklesIcon className="w-5 h-5" /> Roll New Beat
            </button>
            <div className="absolute bottom-full mb-2 w-48 left-1/2 -translate-x-1/2 hidden group-focus-within:block group-hover:block">
              <div className="bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    >
                        {preset.title}
                    </button>
                ))}
              </div>
            </div>
           </div>

          {/* Save to Playlist Button */}
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={isExporting}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>

          <button
            onClick={clearActivePattern}
            className="p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-red-600 hover:text-white transition-colors"
            aria-label="Clear Pattern"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save to Playlist</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Song Name</label>
                <input
                  type="text"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="My Awesome Beat"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as BeatStyle)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="TRAP">Trap</option>
                  <option value="DETROIT">Detroit</option>
                  <option value="FLINT">Flint</option>
                  <option value="CINEMATIC">Cinematic</option>
                  <option value="ROCK">Rock</option>
                  <option value="MAFIA">Mafia</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToPlaylist}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors"
              >
                Save & Export
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}