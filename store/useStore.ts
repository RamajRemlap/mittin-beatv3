import { create } from 'zustand';
import { StoreState, BeatStyle, Step, Preset, SongSection } from '../types';
import { 
  INITIAL_TRACKS, 
  STEPS_PER_BAR, 
  DEFAULT_TEMPO, 
  DEFAULT_SWING, 
  createEmptyPattern, 
  PRESETS, 
  SOUND_KITS, 
  DEFAULT_KIT_ID,
  INITIAL_SECTIONS,
  INITIAL_ARRANGEMENT,
  DEFAULT_PRESET_ID
} from '../constants';
import { generateNewPattern } from '../lib/PatternGenerator';

let sectionIdCounter = 0;
const generateSectionId = () => `section_${Date.now()}_${sectionIdCounter++}`;

export const useStore = create<StoreState>((set, get) => ({
  isPlaying: false,
  tempo: DEFAULT_TEMPO,
  swing: DEFAULT_SWING,
  tracks: INITIAL_TRACKS,
  sections: INITIAL_SECTIONS,
  arrangement: INITIAL_ARRANGEMENT,
  activeSectionId: INITIAL_ARRANGEMENT[0] || null,
  currentStep: -1,
  presets: PRESETS,
  soundKits: SOUND_KITS,
  activeKitId: DEFAULT_KIT_ID,

  setTempo: (tempo) => set({ tempo }),
  setSwing: (swing) => set({ swing }),
  
  setSectionBars: (sectionId, bars) => {
    set(state => {
      const section = state.sections[sectionId];
      if (!section) return {};
      
      const numSteps = bars * STEPS_PER_BAR;
      const currentPattern = section.pattern;
      const newPattern = state.tracks.map((_, trackIndex) => {
        return Array(numSteps).fill(null).map((__, stepIndex) => {
          return currentPattern[trackIndex]?.[stepIndex] || { isActive: false, note: null, velocity: 1 };
        });
      });

      return {
        sections: {
          ...state.sections,
          [sectionId]: { ...section, bars, pattern: newPattern }
        }
      };
    });
  },

  setActiveSectionId: (sectionId) => set({ activeSectionId: sectionId }),
  
  addSection: (name, bars) => {
    const newId = generateSectionId();
    const newSection: SongSection = {
      id: newId,
      name,
      bars,
      pattern: createEmptyPattern(get().tracks.length, bars * STEPS_PER_BAR),
    };
    set(state => ({
      sections: { ...state.sections, [newId]: newSection },
      arrangement: [...state.arrangement, newId]
    }));
  },
  
  deleteSection: (sectionId: string) => {
    set(state => {
      const newSections = { ...state.sections };
      delete newSections[sectionId];
      
      const newArrangement = state.arrangement.filter(id => id !== sectionId);
      
      let newActiveSectionId = state.activeSectionId;
      if (state.activeSectionId === sectionId) {
        newActiveSectionId = newArrangement.length > 0 ? newArrangement[0] : null;
      }

      return {
        sections: newSections,
        arrangement: newArrangement,
        activeSectionId: newActiveSectionId,
      };
    });
  },

  duplicateSection: (sectionId) => {
     const sourceSection = get().sections[sectionId];
     if (!sourceSection) return;
     const newId = generateSectionId();
     const newSection: SongSection = {
       ...sourceSection,
       id: newId,
       name: `${sourceSection.name} Copy`,
       pattern: JSON.parse(JSON.stringify(sourceSection.pattern)), // Deep copy
     };
     set(state => {
        const insertIndex = state.arrangement.lastIndexOf(sectionId) + 1;
        const newArrangement = [...state.arrangement];
        newArrangement.splice(insertIndex, 0, newId);
        return {
          sections: { ...state.sections, [newId]: newSection },
          arrangement: newArrangement
        };
     });
  },

  toggleStep: (trackIndex, stepIndex) => {
    const { activeSectionId } = get();
    if (!activeSectionId) return;

    set(state => {
      const activeSection = state.sections[activeSectionId];
      if (!activeSection) return {};

      const newPattern = activeSection.pattern.map(track => [...track]);
      const currentStepState = newPattern[trackIndex][stepIndex];
      newPattern[trackIndex][stepIndex] = { ...currentStepState, isActive: !currentStepState.isActive };
      
      return {
        sections: {
          ...state.sections,
          [activeSectionId]: { ...activeSection, pattern: newPattern }
        }
      };
    });
  },

  setTrackVolume: (trackIndex, volume) => {
    set(state => ({
      tracks: state.tracks.map((track, i) => i === trackIndex ? { ...track, volume } : track)
    }));
  },
  
  setTrackPan: (trackIndex, pan) => {
    set(state => ({
      tracks: state.tracks.map((track, i) => i === trackIndex ? { ...track, pan } : track)
    }));
  },
  
  setTrackInstrument: (trackIndex, instrumentId) => {
    set(state => ({
      tracks: state.tracks.map((track, i) => i === trackIndex ? { ...track, activeInstrumentId: instrumentId } : track)
    }));
  },
  
  toggleTrackMute: (trackIndex) => {
    set(state => ({
      tracks: state.tracks.map((track, i) => i === trackIndex ? { ...track, mute: !track.mute } : track)
    }));
  },
  
  toggleTrackSolo: (trackIndex) => {
    set(state => {
      const isCurrentlySolo = !state.tracks[trackIndex].solo;
      return {
        tracks: state.tracks.map((track, i) => ({
          ...track,
          solo: i === trackIndex ? isCurrentlySolo : false
        }))
      };
    });
  },

  startPlayback: () => set({ isPlaying: true, currentStep: -1 }),
  stopPlayback: () => set({ isPlaying: false, currentStep: -1 }),
  togglePlayback: () => set(state => ({ isPlaying: !state.isPlaying, currentStep: state.isPlaying ? -1 : state.currentStep })),
  _setCurrentStep: (step) => set({ currentStep: step }),
  
  applyPreset: (presetId: string) => {
    const preset = get().presets.find(p => p.id === presetId);
    if (!preset) return;

    const { tracks } = get();

    // Define song structure based on preset
    const newIntroSection: SongSection = { id: 'intro', name: 'Intro', bars: 4, pattern: generateNewPattern({ style: preset.style, bars: 4, tracks, variation: 'A' }) };
    const newVerseASection: SongSection = { id: 'verseA', name: 'Verse A', bars: 8, pattern: generateNewPattern({ style: preset.style, bars: 8, tracks, variation: 'A' }) };
    const newVerseBSection: SongSection = { id: 'verseB', name: 'Verse B', bars: 8, pattern: generateNewPattern({ style: preset.style, bars: 8, tracks, variation: 'B' }) };
    const newChorusSection: SongSection = { id: 'chorus', name: 'Chorus', bars: 8, pattern: generateNewPattern({ style: preset.style, bars: 8, tracks, variation: 'B' }) };
    
    const newSections = {
      [newIntroSection.id]: newIntroSection,
      [newVerseASection.id]: newVerseASection,
      [newVerseBSection.id]: newVerseBSection,
      [newChorusSection.id]: newChorusSection,
    };
    
    const newArrangement = ['intro', 'verseA', 'chorus', 'verseB', 'chorus', 'chorus'];
    
    const tempos: Record<BeatStyle, number> = {
        'TRAP': 140,
        'DETROIT': 185,
        'FLINT': 165,
        'CINEMATIC': 130,
        'ROCK': 128,
        'MAFIA': 140
    }

    set({
      sections: newSections,
      arrangement: newArrangement,
      activeSectionId: newArrangement[0],
      tempo: tempos[preset.style] || DEFAULT_TEMPO
    });
  },
  
  clearActivePattern: () => {
    const { activeSectionId } = get();
    if (!activeSectionId) return;
    
    set(state => {
      const activeSection = state.sections[activeSectionId];
      if (!activeSection) return {};

      const emptyPattern = createEmptyPattern(state.tracks.length, activeSection.bars * STEPS_PER_BAR);
      return {
        sections: {
          ...state.sections,
          [activeSectionId]: { ...activeSection, pattern: emptyPattern }
        }
      };
    });
  },

  setSoundKit: (kitId: string) => {
    const soundKit = get().soundKits.find(k => k.id === kitId);
    if (soundKit) {
      set(state => ({
        activeKitId: kitId,
        tracks: state.tracks.map(track => {
          const newInstrumentId = soundKit.instruments[track.id];
          if (newInstrumentId && track.instruments.some(inst => inst.id === newInstrumentId)) {
            return { ...track, activeInstrumentId: newInstrumentId };
          }
          return track;
        })
      }));
    }
  }
}));