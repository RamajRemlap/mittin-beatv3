import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Sequencer from './components/Sequencer';
import Transport from './components/Transport';
import Mixer from './components/Mixer';
import HelpSheet from './components/HelpSheet';
import { useStore } from './store/useStore';
import { AudioEngine } from './lib/AudioEngine';
import MidiInputHandler from './lib/MidiInput';
import { loadSamples } from './lib/Samples';
import ArrangementView from './components/ArrangementView';

export default function App() {
  const isPlaying = useStore(state => state.isPlaying);
  const audioEngine = useRef<AudioEngine | null>(null);
  const midiHandler = useRef<MidiInputHandler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row p-2 sm:p-4 gap-4 overflow-hidden">
        <div className="flex-grow flex flex-col gap-4 overflow-x-auto">
          <ArrangementView />
          <Sequencer />
        </div>
        <div className="w-full md:w-64 lg:w-80 flex-shrink-0 flex flex-col gap-4">
          <Mixer />
          <HelpSheet />
        </div>
      </main>
      <Transport />
    </div>
  );
}