import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Sequencer from './components/Sequencer';
import Transport from './components/Transport';
import Mixer from './components/Mixer';
import HelpSheet from './components/HelpSheet';
import GeneratedPlaylist from './components/GeneratedPlaylist';
import { useStore } from './store/useStore';
import { AudioEngine } from './lib/AudioEngine';
import MidiInputHandler from './lib/MidiInput';
import { loadSamples } from './lib/Samples';
import ArrangementView from './components/ArrangementView';
import { exportToWav } from './lib/Exporter';

export default function App() {
  const isPlaying = useStore(state => state.isPlaying);
  const audioEngine = useRef<AudioEngine | null>(null);
  const midiHandler = useRef<MidiInputHandler | null>(null);
  const sampleBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportAndSave = async (name: string, style: any) => {
    const { saveSong, setSongAudio, setIsExporting } = useStore.getState();

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Save song first to get the ID
      saveSong(name, style);
      const savedSongs = useStore.getState().savedSongs;
      const newSongId = savedSongs[0]?.id;

      if (!newSongId) {
        throw new Error('Failed to save song');
      }

      // Export audio
      const storeState = useStore.getState();
      const blob = await exportToWav(storeState, sampleBuffersRef.current, setExportProgress);
      const url = URL.createObjectURL(blob);

      // Update song with audio
      setSongAudio(newSongId, blob, url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Make export function available globally for Transport
  (window as any).__mittenBeatsExport = handleExportAndSave;

  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      let context: AudioContext | null = null;
      try {
        if (!isMounted) return;
        setLoadingMessage('Creating Audio Context...');
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (!isMounted) { context.close(); return; }
        setLoadingMessage('Loading audio samples...');
        const sampleBuffers = await loadSamples(context);
        sampleBuffersRef.current = sampleBuffers;

        if (!isMounted) { context.close(); return; }
        setLoadingMessage('Initializing Audio Engine...');
        const engineInstance = new AudioEngine(context, useStore.getState, sampleBuffers);
        
        // This is the critical section. Only assign the engine and set state if still mounted.
        if (isMounted) {
            audioEngine.current = engineInstance;
            
            if (!midiHandler.current) {
                const handleNoteOn = (note: number, velocity: number) => {
                    const track = useStore.getState().tracks.find(t => t.midiNote === note);
                    if (track && audioEngine.current) {
                        audioEngine.current.triggerSound(track, velocity, null);
                    }
                };
                midiHandler.current = new MidiInputHandler(handleNoteOn);
            }
            
            setIsLoading(false);
        } else {
            // If we've been unmounted during the async operations, we created a context
            // and an engine that are now zombies. We must clean them up immediately.
            engineInstance.close();
        }
      } catch (error) {
        console.error("Failed to initialize audio engine:", error);
        if (isMounted) {
            setLoadingMessage('Error loading audio. Please refresh.');
        }
        // Ensure context is closed on error too
        if (context && context.state !== 'closed') {
            context.close();
        }
      }
    };

    initAudio();

    return () => {
        isMounted = false;
        // The cleanup function uses the ref, which is the single source of truth for the *mounted* engine.
        if (audioEngine.current) {
            audioEngine.current.close();
            audioEngine.current = null;
        }
    }

  }, []);

  useEffect(() => {
    if (audioEngine.current) {
      if (isPlaying) {
        audioEngine.current.start();
      } else {
        audioEngine.current.stop();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        useStore.getState().togglePlayback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tighter text-white mb-4">
          Mitten<span className="text-cyan-400">Beats</span>
        </h1>
        <div className="w-64 bg-gray-700 rounded-full h-2.5">
          <div className="bg-cyan-400 h-2.5 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-400">{loadingMessage}</p>
      </div>
    );
  }

  const isExporting = useStore(state => state.isExporting);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100 flex flex-col">
      <Header />

      {/* Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg font-semibold">Rendering Audio...</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{exportProgress}% complete</p>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col lg:flex-row p-2 sm:p-4 gap-4 overflow-hidden">
        {/* Left side - Main content */}
        <div className="flex-grow flex flex-col gap-4 overflow-x-auto min-w-0">
          <ArrangementView />
          <Sequencer />
        </div>

        {/* Right side - Controls and Playlist */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">
          <Mixer />
          <GeneratedPlaylist />
          <HelpSheet />
        </div>
      </main>
      <Transport />
    </div>
  );
}