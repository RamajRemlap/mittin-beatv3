import { Track, Preset, BeatStyle, SoundKit, Instrument, SongSection } from './types';

export const STEPS_PER_BAR = 16;
export const DEFAULT_BARS = 4;
export const DEFAULT_TEMPO = 155; // Michigan/Flint sweet spot (140-170)
export const DEFAULT_SWING = 0.52; // Slight swing for bounce

export const INSTRUMENTS: Record<string, Instrument> = {
  // Drums (Synth)
  KICK_808: { id: 'kick_808', name: '808 Kick' },
  KICK_GRIT: { id: 'kick_grit', name: 'Grit Kick' },
  SNARE_808: { id: 'snare_808', name: '808 Snare' },
  SNARE_NOISY: { id: 'snare_noisy', name: 'Noisy Snare' },
  CLAP_808: { id: 'clap_808', name: '808 Clap' },
  HAT_CLOSED: { id: 'hat_closed', name: 'Closed Hat' },
  HAT_GRIT: { id: 'hat_grit', name: 'Grit Hat' },
  HAT_OPEN: { id: 'hat_open', name: 'Open Hat' },
  PERC_HIT: { id: 'perc_hit', name: 'High Tom' },
  
  // Drums (Sampled) - NEW
  KICK_TRAP: { id: 'kick_trap', name: 'Trap Kick' },
  SNARE_TRAP: { id: 'snare_trap', name: 'Trap Snare' },
  HAT_TRAP: { id: 'hat_trap', name: 'Trap Hat' },
  
  // Bass
  BASS_808: { id: 'bass_808', name: '808 Bass' },
  BASS_SAW: { id: 'bass_saw', name: 'Grit Bass' },
  BASS_SUB: { id: 'bass_sub', name: 'Sub Bass' },
  BASS_808_SAMPLED: { id: 'bass_808_sampled', name: 'Sampled 808' }, // NEW

  // Melodic
  MELODY_TRIANGLE: { id: 'melody_triangle', name: 'Triangle Lead' },
  MELODY_SAW: { id: 'melody_saw', name: 'Saw Lead' },
  MELODY_SQUARE: { id: 'melody_square', name: 'Square Lead' },
  PIANO_GRAND: { id: 'piano_grand', name: 'Grand Piano' },
  STRINGS_LEGATO: { id: 'strings_legato', name: 'Legato Strings' },
  STRINGS_PIZZICATO: { id: 'strings_pizzicato', name: 'Pizzicato Strings' },
  VIOLIN_SECTION: { id: 'violin_section', name: 'Violin Section' },
  PAD_SINE: { id: 'pad_sine', name: 'Sine Pad' },
  OPERA_VOCAL: { id: 'opera_vocal', name: 'Opera Vocal (Synth)' },
  ARP_TRIANGLE: { id: 'arp_triangle', name: 'Triangle Arp' },
  LEAD_SAW: { id: 'lead_saw', name: 'Saw Lead' },
  LEAD_SQUARE: { id: 'lead_square', name: 'Square Lead' },

  // Genre Instruments
  KICK_ROCK: { id: 'kick_rock', name: 'Rock Kick' },
  SNARE_ROCK: { id: 'snare_rock', name: 'Rock Snare' },
  GUITAR_DISTORTED: { id: 'guitar_distorted', name: 'Distorted Guitar' },
  MANDOLIN_TREMOLO: { id: 'mandolin_tremolo', name: 'Mandolin' },
  ACCORDION: { id: 'accordion', name: 'Accordion' },
  ORCH_HIT: { id: 'orch_hit', name: 'Orchestral Hit' },
  TIMPANI: { id: 'timpani', name: 'Timpani' },

  // Expressive Instruments
  HARPSICHORD: { id: 'harpsichord', name: 'Harpsichord' },
  FRENCH_HORN: { id: 'french_horn', name: 'French Horn' },
  CHOIR_AAHS: { id: 'choir_aahs', name: 'Choir Aahs (Synth)' },
  FILTER_SWEEP_PAD: { id: 'filter_sweep_pad', name: 'Filter Sweep Pad' },

  // Sampled Vocals - NEW
  CHOIR_SAMPLED: { id: 'choir_sampled', name: 'Sampled Choir' },
  OPERA_SAMPLED: { id: 'opera_sampled', name: 'Sampled Opera' },
};

export const INITIAL_TRACKS: Track[] = [
  { id: 'kick', name: 'Kick', volume: 1, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.KICK_808, INSTRUMENTS.KICK_GRIT, INSTRUMENTS.KICK_ROCK, INSTRUMENTS.KICK_TRAP], activeInstrumentId: INSTRUMENTS.KICK_808.id, midiNote: 36 },
  { id: 'snare', name: 'Snare', volume: 0.9, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.SNARE_808, INSTRUMENTS.SNARE_NOISY, INSTRUMENTS.SNARE_ROCK, INSTRUMENTS.SNARE_TRAP], activeInstrumentId: INSTRUMENTS.SNARE_808.id, midiNote: 38 },
  { id: 'clap', name: 'Clap', volume: 0.8, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.CLAP_808, INSTRUMENTS.ORCH_HIT], activeInstrumentId: INSTRUMENTS.CLAP_808.id, midiNote: 39 },
  { id: 'hat', name: 'Hi-Hat', volume: 0.7, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.HAT_CLOSED, INSTRUMENTS.HAT_GRIT, INSTRUMENTS.HAT_TRAP], activeInstrumentId: INSTRUMENTS.HAT_CLOSED.id, midiNote: 42 },
  { id: 'openhat', name: 'Open Hat', volume: 0.7, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.HAT_OPEN], activeInstrumentId: INSTRUMENTS.HAT_OPEN.id, midiNote: 46 },
  { id: 'perc', name: 'Perc', volume: 0.8, pan: 0.2, mute: false, solo: false, instruments: [INSTRUMENTS.PERC_HIT, INSTRUMENTS.TIMPANI], activeInstrumentId: INSTRUMENTS.PERC_HIT.id, midiNote: 45 },
  { id: 'bass', name: '808 Bass', volume: 1, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.BASS_808, INSTRUMENTS.BASS_SAW, INSTRUMENTS.BASS_SUB, INSTRUMENTS.BASS_808_SAMPLED], activeInstrumentId: INSTRUMENTS.BASS_808.id },
  { id: 'melody', name: 'Melody', volume: 0.7, pan: -0.1, mute: false, solo: false, instruments: [INSTRUMENTS.MELODY_TRIANGLE, INSTRUMENTS.MELODY_SAW, INSTRUMENTS.PIANO_GRAND, INSTRUMENTS.MANDOLIN_TREMOLO, INSTRUMENTS.HARPSICHORD], activeInstrumentId: INSTRUMENTS.MELODY_TRIANGLE.id },
  { id: 'strings', name: 'Strings', volume: 0.6, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.STRINGS_LEGATO, INSTRUMENTS.VIOLIN_SECTION, INSTRUMENTS.FRENCH_HORN], activeInstrumentId: INSTRUMENTS.STRINGS_LEGATO.id },
  { id: 'pad', name: 'Pad', volume: 0.5, pan: 0.1, mute: false, solo: false, instruments: [INSTRUMENTS.PAD_SINE, INSTRUMENTS.OPERA_VOCAL, INSTRUMENTS.CHOIR_AAHS, INSTRUMENTS.FILTER_SWEEP_PAD, INSTRUMENTS.CHOIR_SAMPLED, INSTRUMENTS.OPERA_SAMPLED], activeInstrumentId: INSTRUMENTS.PAD_SINE.id },
  { id: 'arp', name: 'Arp', volume: 0.6, pan: -0.2, mute: false, solo: false, instruments: [INSTRUMENTS.ARP_TRIANGLE], activeInstrumentId: INSTRUMENTS.ARP_TRIANGLE.id },
  { id: 'lead', name: 'Lead', volume: 0.7, pan: 0, mute: false, solo: false, instruments: [INSTRUMENTS.LEAD_SAW, INSTRUMENTS.LEAD_SQUARE, INSTRUMENTS.GUITAR_DISTORTED], activeInstrumentId: INSTRUMENTS.LEAD_SAW.id },
];

export const PRESETS: Preset[] = [
    { id: 'trap_banger_140', title: 'Trap – Menace Banger', style: 'TRAP' },
    { id: 'detroit_drive_185', title: 'Detroit – Relentless Drive', style: 'DETROIT' },
    { id: 'flint_talk_165', title: 'Flint – Conversational Groove', style: 'FLINT' },
    { id: 'cinematic_tension_130', title: 'Cinematic – Gotham Tension', style: 'CINEMATIC' },
    { id: 'mafia_waltz_140', title: 'Mafia – Alley Waltz', style: 'MAFIA'},
    { id: 'rock_anthem_128', title: 'Rock – Garage Anthem', style: 'ROCK'},
];

export const SOUND_KITS: SoundKit[] = [
    { 
        id: 'heavy_trap', 
        name: 'Heavy Trap',
        instruments: {
            kick: INSTRUMENTS.KICK_TRAP.id,
            snare: INSTRUMENTS.SNARE_TRAP.id,
            hat: INSTRUMENTS.HAT_TRAP.id,
            bass: INSTRUMENTS.BASS_808_SAMPLED.id,
            melody: INSTRUMENTS.PIANO_GRAND.id,
            pad: INSTRUMENTS.CHOIR_SAMPLED.id,
        }
    },
    { 
        id: 'classic_808', 
        name: 'Classic 808',
        instruments: {
            kick: INSTRUMENTS.KICK_808.id,
            snare: INSTRUMENTS.SNARE_808.id,
            hat: INSTRUMENTS.HAT_CLOSED.id,
            bass: INSTRUMENTS.BASS_808.id,
            melody: INSTRUMENTS.MELODY_TRIANGLE.id,
            lead: INSTRUMENTS.LEAD_SAW.id,
        }
    },
    { 
        id: 'detroit_grit', 
        name: 'Detroit Grit',
        instruments: {
            kick: INSTRUMENTS.KICK_GRIT.id,
            snare: INSTRUMENTS.SNARE_NOISY.id,
            hat: INSTRUMENTS.HAT_GRIT.id,
            bass: INSTRUMENTS.BASS_SAW.id,
            melody: INSTRUMENTS.MELODY_SAW.id,
            lead: INSTRUMENTS.LEAD_SQUARE.id,
        }
    },
];

export const DEFAULT_KIT_ID = SOUND_KITS[0].id;
export const DEFAULT_PRESET_ID = PRESETS[0].id;


export const createEmptyPattern = (numTracks: number, numSteps: number) => {
    return Array(numTracks).fill(0).map(() => 
        Array(numSteps).fill(0).map(() => ({
            note: null,
            velocity: 1,
            isActive: false,
        }))
    );
};

// --- MUSIC THEORY CONSTANTS ---
export type Chord = { degree: number; type: 'm' | 'M' | 'dim' | 'aug'; };
type Progression = Chord[];
export const CHORD_PROGRESSIONS: Record<BeatStyle, { A: Progression[], B: Progression[] }> = {
    TRAP: {
        A: [
             [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 6, type: 'M'}, {degree: 3, type: 'M'}], // i-VI-VII-IV
             [{degree: 0, type: 'm'}, {degree: 3, type: 'M'}, {degree: 6, type: 'M'}, {degree: 6, type: 'M'}], // i-IV-VII-VII (darker)
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 6, type: 'M'}], // i-i-VI-VII
            [{degree: 0, type: 'm'}, {degree: 2, type: 'M'}, {degree: 5, type: 'M'}, {degree: 6, type: 'M'}], // i-III-VI-VII (tension)
        ],
    },
    CINEMATIC: {
        A: [
            [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 4, type: 'm'}, {degree: 3, type: 'M'}], // i-VI-v-IV
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 3, type: 'M'}, {degree: 2, type: 'M'}, {degree: 5, type: 'M'}], // i-IV-III-VI
        ],
    },
    DETROIT: {
        A: [
            [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 6, type: 'M'}, {degree: 0, type: 'm'}], // i-VI-VII-i
            [{degree: 0, type: 'm'}, {degree: 3, type: 'M'}, {degree: 6, type: 'M'}, {degree: 5, type: 'M'}], // i-IV-VII-VI
            [{degree: 0, type: 'm'}, {degree: 6, type: 'M'}, {degree: 3, type: 'M'}, {degree: 5, type: 'M'}], // i-VII-IV-VI (modern variation)
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 4, type: 'm'}, {degree: 5, type: 'M'}, {degree: 3, type: 'M'}], // i-v-VI-IV
            [{degree: 6, type: 'M'}, {degree: 5, type: 'M'}, {degree: 3, type: 'M'}, {degree: 0, type: 'm'}], // VII-VI-IV-i
            [{degree: 0, type: 'm'}, {degree: 2, type: 'M'}, {degree: 6, type: 'M'}, {degree: 5, type: 'M'}], // i-III-VII-VI (energetic)
        ],
    },
    FLINT: {
        A: [
            [{degree: 0, type: 'm'}, {degree: 3, type: 'M'}, {degree: 4, type: 'm'}, {degree: 0, type: 'm'}], // i-IV-v-i
            [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 3, type: 'M'}, {degree: 4, type: 'm'}], // i-VI-IV-v
            [{degree: 0, type: 'm'}, {degree: 6, type: 'M'}, {degree: 5, type: 'M'}, {degree: 4, type: 'm'}], // i-VII-VI-v (modern bounce)
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 1, type: 'dim'}, {degree: 4, type: 'm'}], // i-VI-ii°-v
            [{degree: 3, type: 'M'}, {degree: 4, type: 'm'}, {degree: 0, type: 'm'}, {degree: 5, type: 'M'}], // IV-v-i-VI
            [{degree: 0, type: 'm'}, {degree: 2, type: 'M'}, {degree: 3, type: 'M'}, {degree: 6, type: 'M'}], // i-III-IV-VII (charged)
        ],
    },
    ROCK: {
         A: [
            [{degree: 0, type: 'm'}, {degree: 5, type: 'M'}, {degree: 3, type: 'M'}, {degree: 4, type: 'M'}], // i-VI-IV-V (minor key)
            [{degree: 0, type: 'M'}, {degree: 3, type: 'M'}, {degree: 4, type: 'M'}, {degree: 0, type: 'M'}], // I-IV-V-I (major key)
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 2, type: 'M'}, {degree: 5, type: 'M'}, {degree: 4, type: 'M'}], // i-III-VI-V
            [{degree: 3, type: 'M'}, {degree: 5, type: 'M'}, {degree: 0, type: 'm'}, {degree: 4, type: 'M'}], // IV-VI-i-V
        ],
    },
    MAFIA: {
        A: [
            [{degree: 0, type: 'm'}, {degree: 4, type: 'M'}, {degree: 0, type: 'm'}, {degree: 6, type: 'dim'}], // i-V-i-vii° (using V instead of v for tension)
            [{degree: 0, type: 'm'}, {degree: 3, type: 'M'}, {degree: 4, type: 'M'}, {degree: 6, type: 'dim'}], // i-IV-V-vii°
        ],
        B: [
            [{degree: 0, type: 'm'}, {degree: 6, type: 'dim'}, {degree: 2, type: 'M'}, {degree: 4, 'type': 'M'}], // i-vii°-III-V
            [{degree: 3, type: 'M'}, {degree: 6, type: 'dim'}, {degree: 0, type: 'm'}, {degree: 4, type: 'M'}], // IV-vii°-i-V
        ],
    }
};

// --- INITIAL SONG STRUCTURE ---
export const INITIAL_SECTIONS: Record<string, SongSection> = {
    'intro': { id: 'intro', name: 'Intro', bars: 4, pattern: createEmptyPattern(INITIAL_TRACKS.length, 4 * STEPS_PER_BAR) },
    'verse': { id: 'verse', name: 'Verse', bars: 8, pattern: createEmptyPattern(INITIAL_TRACKS.length, 8 * STEPS_PER_BAR) },
    'chorus': { id: 'chorus', name: 'Chorus', bars: 8, pattern: createEmptyPattern(INITIAL_TRACKS.length, 8 * STEPS_PER_BAR) },
};

export const INITIAL_ARRANGEMENT: string[] = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'chorus'];