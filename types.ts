export interface Step {
  note: string | null;
  velocity: number;
  isActive: boolean;
}

export interface Instrument {
  id: string;
  name: string;
}

export interface Track {
  id: string;
  name: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  instruments: Instrument[];
  activeInstrumentId: string;
  midiNote?: number; // MIDI note number for triggering
}

export type Pattern = Step[][]; // [trackIndex][stepIndex]

export type Patterns = Record<string, Pattern>;

export type BeatStyle = 'DETROIT' | 'FLINT' | 'CINEMATIC' | 'ROCK' | 'MAFIA' | 'TRAP';

export interface Preset {
  id: string;
  title: string;
  style: BeatStyle;
}

export interface SoundKit {
  id: string;
  name: string;
  instruments: Record<string, string>; // Maps trackId to instrumentId
}

export interface SongSection {
  id: string;
  name: string;
  bars: number;
  pattern: Pattern;
}

export interface StoreState {
  isPlaying: boolean;
  tempo: number;
  swing: number;
  tracks: Track[];
  sections: Record<string, SongSection>;
  arrangement: string[]; // Array of section IDs
  activeSectionId: string | null;
  currentStep: number;
  presets: Preset[];
  soundKits: SoundKit[];
  activeKitId: string;

  setTempo: (tempo: number) => void;
  setSwing: (swing: number) => void;
  setSectionBars: (sectionId: string, bars: number) => void;
  setActiveSectionId: (sectionId: string) => void;
  addSection: (name: string, bars: number) => void;
  duplicateSection: (sectionId: string) => void;
  deleteSection: (sectionId: string) => void;
  
  toggleStep: (trackIndex: number, stepIndex: number) => void;
  setTrackVolume: (trackIndex: number, volume: number) => void;
  setTrackPan: (trackIndex: number, pan: number) => void;
  setTrackInstrument: (trackIndex: number, instrumentId: string) => void;
  toggleTrackMute: (trackIndex: number) => void;
  toggleTrackSolo: (trackIndex: number) => void;
  
  startPlayback: () => void;
  stopPlayback: () => void;
  togglePlayback: () => void;
  
  applyPreset: (presetId: string) => void;
  clearActivePattern: () => void;
  setSoundKit: (kitId: string) => void;

  // Internal playback state - not for direct user interaction
  _setCurrentStep: (step: number) => void;
}