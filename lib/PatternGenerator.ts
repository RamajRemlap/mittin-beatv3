import { BeatStyle, Track, Pattern } from '../types';
import { STEPS_PER_BAR, CHORD_PROGRESSIONS, Chord } from '../constants';

// --- UTILITY FUNCTIONS ---
const rand = (max: number) => Math.random() * max;
const randInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const choice = <T,>(arr: T[]): T => arr[Math.floor(rand(arr.length))];
const prob = (p: number) => Math.random() < p;

// --- MUSIC THEORY ---
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = {
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
};

const CHORD_TONES: Record<Chord['type'], number[]> = {
    'm': [0, 3, 7],
    'M': [0, 4, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
};

class PatternBuilder {
    private pattern: Pattern;
    private totalSteps: number;
    private trackMap: Record<string, number>;
    
    constructor(tracks: Track[], bars: number) {
        this.totalSteps = bars * STEPS_PER_BAR;
        this.trackMap = tracks.reduce((acc, track, i) => {
            acc[track.id] = i;
            return acc;
        }, {} as Record<string, number>);
        this.pattern = Array(tracks.length).fill(0).map(() => 
            Array(this.totalSteps).fill(0).map(() => ({ isActive: false, note: null, velocity: 1 }))
        );
    }

    setStep(trackId: string, step: number, velocity = 1, note: string | null = null) {
        const trackIndex = this.trackMap[trackId];
        if (trackIndex === undefined || step < 0 || step >= this.totalSteps) return;

        const humanizedVelocity = this.humanizeVelocity(velocity, step);
        this.pattern[trackIndex][step] = { isActive: true, note, velocity: humanizedVelocity };
    }

    getStep(trackId: string, step: number) {
        const trackIndex = this.trackMap[trackId];
        return this.pattern[trackIndex]?.[step];
    }
    
    build(): Pattern {
        return this.pattern;
    }

    private humanizeVelocity(baseVelocity: number, step: number): number {
        let vel = baseVelocity;
        if (step % 8 === 0) vel *= randInRange(1.0, 1.15); // Strongest accent on downbeats
        else if (step % 4 === 0) vel *= randInRange(0.95, 1.05); // Accent on other beats
        else vel *= randInRange(0.85, 0.95); // Lighter off-beats
        return Math.min(1.2, Math.max(0.1, vel));
    }
}

function getNoteInScale(rootNoteName: string, octave: number, scaleIntervals: number[], degree: number): string {
    const rootMidiBase = NOTES.indexOf(rootNoteName);
    const numDegrees = scaleIntervals.length;
    
    const degreeOctave = Math.floor(degree / numDegrees);
    const scaleDegree = ((degree % numDegrees) + numDegrees) % numDegrees;
    
    const midiNote = rootMidiBase + ((octave + degreeOctave) * 12) + scaleIntervals[scaleDegree];
    
    const noteName = NOTES[midiNote % 12];
    const noteOctave = Math.floor(midiNote / 12);
    return `${noteName}${noteOctave}`;
}

function getChordNotes(rootNote: string, octave: number, scale: number[], chord: Chord): string[] {
    const tones = CHORD_TONES[chord.type];
    return tones.map(toneInterval => {
       const degree = chord.degree + Math.floor(toneInterval / 2); // rough mapping to scale degree
       const rootNoteOfChord = getNoteInScale(rootNote, octave, scale, chord.degree);
       const rootMidi = NOTES.indexOf(rootNoteOfChord.slice(0,-1)) + parseInt(rootNoteOfChord.slice(-1)) * 12;
       const noteMidi = rootMidi + toneInterval;
       return `${NOTES[noteMidi % 12]}${Math.floor(noteMidi / 12)}`;
    });
}

// --- CORE GENERATION LOGIC ---
export function generateNewPattern({ style, bars, tracks, variation = 'A' }: { style: BeatStyle, bars: number, tracks: Track[], variation?: 'A' | 'B' }): Pattern {
    const builder = new PatternBuilder(tracks, bars);
    const progression = choice(CHORD_PROGRESSIONS[style][variation]);
    
    const barChords: Chord[] = [];
    for (let bar = 0; bar < bars; bar++) {
        barChords.push(progression[bar % progression.length]);
    }

    const key = style === 'ROCK' ? 'E' : style === 'MAFIA' ? 'A' : style === 'TRAP' ? 'C#' : 'C#';
    const scale = style === 'MAFIA' || style === 'TRAP' ? SCALES.harmonic_minor : SCALES.natural_minor;

    // --- Generate Rhythm Section First ---
    generateDrums(builder, bars, style, variation);
    
    // --- Generate Harmony and Melody based on Rhythm and Chords ---
    generateHarmonyAndMelody(builder, bars, style, barChords, key, scale, variation);
  
    return builder.build();
}

// --- RHYTHM GENERATOR ---
function generateDrums(builder: PatternBuilder, bars: number, style: BeatStyle, variation: 'A' | 'B') {
     for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;

        // --- Shared logic ---
        const snareStep = style === 'MAFIA' ? 4 : style === 'TRAP' ? 8 : 4;
        const snareStep2 = style === 'MAFIA' || style === 'TRAP' ? -1 : 12;
        builder.setStep('snare', barStart + snareStep, 1.0);
        if(snareStep2 > 0) builder.setStep('snare', barStart + snareStep2, 0.9);
        if(prob(0.3) && style !== 'TRAP') builder.setStep('snare', barStart + choice([7, 15]), 0.2); // ghost note

        // --- Style-specific logic ---
        switch(style) {
            case 'TRAP':
                const kickPattern = variation === 'A' ? [0, 9] : [0, 6, 9, 14];
                for (const step of kickPattern) builder.setStep('kick', barStart + step, 1.0);

                // Hi-hats every 8th note with rolls
                for (let i = 0; i < STEPS_PER_BAR; i++) {
                    if (i % 2 === 0) builder.setStep('hat', barStart + i, randInRange(0.5, 0.7));
                }
                if (prob(0.7)) { // Add a roll at the end of the bar
                    const rollStart = choice([12, 13, 14]);
                    const rollLength = choice([2, 3, 4]);
                    for (let i = 0; i < rollLength; i++) {
                        builder.setStep('hat', barStart + rollStart + i, randInRange(0.4, 0.6));
                    }
                }
                if(prob(0.3)) builder.setStep('openhat', barStart + choice([6, 14]), 0.6);
                break;

            case 'DETROIT':
                const detroitKick = variation === 'A' ? [0, 6, 10] : [0, 3, 6, 10, 14];
                for (const step of detroitKick) builder.setStep('kick', barStart + step, 1.0);
                for (let i = 0; i < STEPS_PER_BAR; i++) { // Dense hats
                    if (variation === 'B' || i % 2 === 0) builder.setStep('hat', barStart + i, 0.6);
                }
                if (variation === 'B' && prob(0.5)) builder.setStep('openhat', barStart + 14, 0.7);
                break;
            case 'FLINT':
                const flintKick = variation === 'A' ? [0, 9, 13] : [0, 7, 11, 14];
                for (const step of flintKick) builder.setStep('kick', barStart + step, 1.0);
                for (let i = 0; i < STEPS_PER_BAR; i += 2) builder.setStep('hat', barStart + i, 0.7);
                builder.setStep('perc', barStart + choice([3, 7, 11]), 0.8);
                break;
            case 'CINEMATIC':
                builder.setStep('kick', barStart, 1.0);
                if (variation === 'B') builder.setStep('kick', barStart + 8, 0.8);
                if (variation === 'B' && prob(0.6)) builder.setStep('kick', barStart + 10, 0.9);
                for (let i = 0; i < STEPS_PER_BAR; i += 4) builder.setStep('hat', barStart + i, 0.5);
                break;
            case 'ROCK':
                 for (let i = 0; i < STEPS_PER_BAR; i += 4) builder.setStep('kick', barStart + i, 1.0);
                 for (let i = 0; i < STEPS_PER_BAR; i += 2) builder.setStep('hat', barStart + i, 0.7);
                 if (prob(0.4)) builder.setStep('openhat', barStart + 14, 0.7);
                break;
            case 'MAFIA':
                builder.setStep('kick', barStart, 1.0); // Waltz kick
                break;
        }
     }
}

// --- HARMONY/MELODY GENERATOR ---
function generateHarmonyAndMelody(builder: PatternBuilder, bars: number, style: BeatStyle, barChords: Chord[], key: string, scale: number[], variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const chord = barChords[bar];
        const chordNotes = getChordNotes(key, 4, scale, chord);
        const bassNote = getNoteInScale(key, 2, scale, chord.degree);
        const padNote = getNoteInScale(key, 3, scale, chord.degree);

        // --- Bass ---
        if (style === 'MAFIA') { // Waltz oom-pah
            const fifthNote = getNoteInScale(key, 3, scale, chord.degree + 4);
            builder.setStep('bass', barStart, 1.0, bassNote);
            builder.setStep('bass', barStart + 4, 0.8, fifthNote);
            builder.setStep('bass', barStart + 8, 0.8, fifthNote);
        } else if (style === 'TRAP') {
            const bassRhythm = variation === 'A' ? [0, 8] : [0, 6, 9, 14];
            for (const step of bassRhythm) {
                 const currentChord = barChords[Math.floor((bar*STEPS_PER_BAR + step) / STEPS_PER_BAR)];
                 const note = getNoteInScale(key, 2, scale, currentChord.degree);
                 builder.setStep('bass', barStart + step, 1.0, note);
            }
        } else {
             const kickStep = builder.getStep('kick', barStart);
             if (kickStep?.isActive) builder.setStep('bass', barStart, 1.0, bassNote);
             if (prob(0.7)) {
                const offbeatStep = choice([6, 10, 13, 14]);
                const kickAtStep = builder.getStep('kick', barStart+offbeatStep);
                if (kickAtStep?.isActive) builder.setStep('bass', barStart+offbeatStep, 0.9, bassNote);
             }
        }
        
        // --- Pads & Strings (long sustained notes) ---
        if(style !== 'TRAP' || variation === 'B') {
           builder.setStep('pad', barStart, 0.6, padNote);
           builder.setStep('strings', barStart, 0.7, padNote);
        }
        
        // --- Melodic content ---
        if (variation === 'A') { // Sparser A section
            const arpPattern = style === 'TRAP' ? [0, 4, 7, 10, 14] : [0, 4, 8, 12];
            for (const step of arpPattern) {
                if(prob(0.7)) builder.setStep('arp', barStart + step, 0.7, choice(chordNotes));
            }
        } else { // Denser B section
             const melodyRhythm = style === 'TRAP' ? [0, 3, 6, 9, 12] : choice([[0, 6, 10], [0, 3, 7, 13], [0, 2, 4, 6, 8, 10, 12, 14]]);
             for(const step of melodyRhythm) {
                 if(prob(0.8)) builder.setStep('melody', barStart + step, 0.8, choice(chordNotes));
             }

             // Add lead line
             const leadRhythm = [0, 6, 10];
             const leadRoot = getNoteInScale(key, 5, scale, chord.degree);
             for(const step of leadRhythm) {
                 if(prob(0.6)) builder.setStep('lead', barStart + step, 0.9, leadRoot);
             }
        }
    }
}