import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { PlayIcon, PauseIcon, TrashIcon } from './Icons';

export default function GeneratedPlaylist() {
  const savedSongs = useStore(state => state.savedSongs);
  const selectedSongId = useStore(state => state.selectedSongId);
  const loadSong = useStore(state => state.loadSong);
  const deleteSong = useStore(state => state.deleteSong);
  const setSelectedSongId = useStore(state => state.setSelectedSongId);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (songId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingId === songId) {
      // Pause current
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Stop previous and play new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlayingId(null);
      audioRef.current.play();
      setPlayingId(songId);
    }
  };

  const handleSongClick = (songId: string) => {
    setSelectedSongId(songId);
  };

  const handleDoubleClick = (songId: string) => {
    loadSong(songId);
  };

  const handleDelete = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (playingId === songId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    deleteSong(songId);
  };

  const handleDownload = (song: typeof savedSongs[0]) => {
    if (!song.audioBlob) return;
    const url = URL.createObjectURL(song.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.name.replace(/\s+/g, '_')}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      'TRAP': 'bg-red-500/20 text-red-400 border-red-500/30',
      'DETROIT': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'FLINT': 'bg-green-500/20 text-green-400 border-green-500/30',
      'CINEMATIC': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'ROCK': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MAFIA': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[style] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (savedSongs.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Generated Playlist
        </h3>
        <p className="text-xs text-gray-500 text-center py-4">
          No songs yet. Generate a beat and save it to build your playlist!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Generated Playlist ({savedSongs.length})
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {savedSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => handleSongClick(song.id)}
            onDoubleClick={() => handleDoubleClick(song.id)}
            className={`
              group p-3 rounded-lg cursor-pointer transition-all duration-200
              ${selectedSongId === song.id
                ? 'bg-cyan-500/20 border border-cyan-500/50 ring-1 ring-cyan-500/30'
                : 'bg-gray-900/50 border border-gray-700/50 hover:bg-gray-800/80 hover:border-gray-600/50'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause(song.id, song.audioUrl);
                }}
                disabled={!song.audioUrl}
                className={`
                  p-2 rounded-full transition-all duration-200
                  ${song.audioUrl
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {playingId === song.id ? (
                  <PauseIcon className="w-3 h-3" />
                ) : (
                  <PlayIcon className="w-3 h-3" />
                )}
              </button>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {song.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStyleColor(song.style)}`}>
                    {song.style}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">
                    {song.tempo} BPM
                  </span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-[10px] text-gray-500">
                    {formatDate(song.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {song.audioBlob && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(song);
                    }}
                    className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                    title="Download WAV"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, song.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Playback Progress Indicator */}
            {playingId === song.id && (
              <div className="mt-2 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 animate-pulse" style={{ width: '100%' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-600 mt-3 text-center">
        Double-click to load • Click to select
      </p>
    </div>
  );
}
