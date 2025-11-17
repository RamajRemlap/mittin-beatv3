import { BeatStyle, Track, Pattern } from '../types';
import { STEPS_PER_BAR, CHORD_PROGRESSIONS, Chord } from '../constants';

// --- UTILITY FUNCTIONS ---
const rand = (max: number) => Math.random() * max;
const randInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const choice = <T,>(arr: T[]): T => arr[Math.floor(rand(arr.length))];
const prob = (p: number) => Math.random() < p;

// --- ADVANCED PATTERN ALGORITHMS ---

// Euclidean rhythm generator for mathematically perfect groove distribution
function generateEuclideanRhythm(steps: number, pulses: number): boolean[] {
    const pattern = new Array(steps).fill(false);
    const bucket = new Array(steps).fill(0);

    for (let i = 0; i < steps; i++) {
        bucket[i] = Math.floor((i * pulses) / steps);
    }

    for (let i = 0; i < steps; i++) {
        if (i === 0 || bucket[i] !== bucket[i - 1]) {
            pattern[i] = true;
        }
    }

    return pattern;
}

// Polyrhythmic pattern generator for complex rhythms
function generatePolyrhythm(baseSteps: number, ratio: number): boolean[] {
    const pattern = new Array(baseSteps).fill(false);
    const polySteps = Math.floor(baseSteps / ratio);

    for (let i = 0; i < polySteps; i++) {
        const idx = Math.floor(i * ratio);
        if (idx < baseSteps) pattern[idx] = true;
    }

    return pattern;
}

// Melodic contour generator for natural-sounding melodies
type MelodicContour = 'ascending' | 'descending' | 'arch' | 'valley' | 'random';

function generateMelodicLine(
    length: number,
    chordNotes: string[],
    scaleRoot: string,
    octave: number,
    scale: number[],
    contour: MelodicContour = 'arch'
): string[] {
    const melody: string[] = [];
    const range = chordNotes.length + 3; // Extend beyond chord tones

    for (let i = 0; i < length; i++) {
        const progress = i / (length - 1);
        let degree = 0;

        switch (contour) {
            case 'ascending':
                degree = Math.floor(progress * range);
                break;
            case 'descending':
                degree = Math.floor((1 - progress) * range);
                break;
            case 'arch':
                degree = Math.floor(Math.sin(progress * Math.PI) * range);
                break;
            case 'valley':
                degree = Math.floor((1 - Math.sin(progress * Math.PI)) * range);
                break;
            case 'random':
                degree = Math.floor(Math.random() * range);
                break;
        }

        melody.push(getNoteInScale(scaleRoot, octave, scale, degree));
    }

    return melody;
}

// Advanced groove/swing calculator with microtiming
function calculateGrooveOffset(step: number, style: BeatStyle, variation: 'A' | 'B'): number {
    const swingAmount = style === 'TRAP' ? 0.05 : style === 'DETROIT' ? 0.08 : 0.03;

    // Add different swing on odd steps
    if (step % 2 === 1) {
        return swingAmount;
    }

    return 0;
}

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

// --- ADVANCED RHYTHM GENERATOR ---
function generateDrums(builder: PatternBuilder, bars: number, style: BeatStyle, variation: 'A' | 'B') {
     for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;

        // --- Style-specific logic with advanced algorithms ---
        switch(style) {
            case 'TRAP':
                // Use Euclidean rhythms for trap kick patterns
                const kickPulses = variation === 'A' ? 3 : 5;
                const kickEuclidean = generateEuclideanRhythm(STEPS_PER_BAR, kickPulses);
                kickEuclidean.forEach((hit, i) => {
                    if (hit) builder.setStep('kick', barStart + i, 1.0);
                });

                // Advanced hi-hat patterns with triplet feels
                for (let i = 0; i < STEPS_PER_BAR; i++) {
                    if (i % 2 === 0) {
                        const velocity = i % 4 === 0 ? 0.7 : 0.5;
                        builder.setStep('hat', barStart + i, randInRange(velocity - 0.1, velocity + 0.1));
                    }
                }

                // Advanced trap rolls with acceleration
                if (prob(0.8) && bar % 2 === 1) {
                    const rollStart = choice([10, 12, 13]);
                    const rollPattern = [1, 1, 2, 3]; // Accelerating intervals
                    let offset = 0;
                    for (const interval of rollPattern) {
                        if (barStart + rollStart + offset < barStart + STEPS_PER_BAR) {
                            builder.setStep('hat', barStart + rollStart + offset, randInRange(0.4, 0.6));
                        }
                        offset += interval;
                    }
                }

                // Snare with variations
                const trapSnareStep = 8;
                builder.setStep('snare', barStart + trapSnareStep, 1.0);
                if (variation === 'B' && prob(0.6)) {
                    builder.setStep('snare', barStart + trapSnareStep - 1, 0.3); // flam
                }
                if (prob(0.3)) builder.setStep('clap', barStart + trapSnareStep, 0.8); // layer clap

                if(prob(0.3)) builder.setStep('openhat', barStart + choice([6, 14]), 0.6);
                break;

            case 'DETROIT':
                // Detroit techno uses polyrhythmic kick patterns
                const detroitPulses = variation === 'A' ? 5 : 7;
                const detroitPattern = generateEuclideanRhythm(STEPS_PER_BAR, detroitPulses);
                detroitPattern.forEach((hit, i) => {
                    if (hit) builder.setStep('kick', barStart + i, 1.0);
                });

                // Relentless hi-hat pattern with subtle variations
                const hatDensity = variation === 'B' ? 1 : 2;
                for (let i = 0; i < STEPS_PER_BAR; i += hatDensity) {
                    const accent = i % 4 === 0 ? 0.8 : 0.6;
                    builder.setStep('hat', barStart + i, accent);
                }

                // Snare on 4 and 12 (backbeat)
                builder.setStep('snare', barStart + 4, 1.0);
                builder.setStep('snare', barStart + 12, 0.95);
                if (prob(0.2)) builder.setStep('snare', barStart + choice([7, 15]), 0.25); // ghost

                if (variation === 'B' && prob(0.5)) builder.setStep('openhat', barStart + 14, 0.7);
                if (variation === 'B' && prob(0.4)) builder.setStep('perc', barStart + choice([2, 6, 10]), 0.5);
                break;

            case 'FLINT':
                // Flint groove with syncopation
                const flintKick = variation === 'A' ? [0, 9, 13] : [0, 5, 7, 11, 14];
                for (const step of flintKick) builder.setStep('kick', barStart + step, 1.0);

                // Call-and-response snare pattern
                builder.setStep('snare', barStart + 4, 1.0);
                builder.setStep('snare', barStart + 12, 0.9);
                if (variation === 'B' && prob(0.7)) {
                    builder.setStep('clap', barStart + 6, 0.5);
                    builder.setStep('clap', barStart + 10, 0.5);
                }

                // Polyrhythmic hi-hats
                const hatPoly = generatePolyrhythm(STEPS_PER_BAR, 3);
                hatPoly.forEach((hit, i) => {
                    if (hit) builder.setStep('hat', barStart + i, 0.7);
                });

                builder.setStep('perc', barStart + choice([3, 7, 11]), 0.8);
                break;

            case 'CINEMATIC':
                // Minimal, powerful kick
                builder.setStep('kick', barStart, 1.0);
                if (variation === 'B') {
                    builder.setStep('kick', barStart + 8, 0.85);
                    if (prob(0.6)) builder.setStep('kick', barStart + 10, 0.9);
                }

                // Sparse, dramatic snare
                builder.setStep('snare', barStart + 4, 1.0);
                if (variation === 'B') builder.setStep('snare', barStart + 12, 0.95);

                // Minimal hi-hats
                for (let i = 0; i < STEPS_PER_BAR; i += 4) {
                    builder.setStep('hat', barStart + i, 0.5);
                }

                // Add tension with perc
                if (variation === 'B' && prob(0.5)) {
                    builder.setStep('perc', barStart + 14, 0.7);
                }
                break;

            case 'ROCK':
                // Classic rock beat
                const rockKickPattern = [0, 8];
                if (variation === 'B') rockKickPattern.push(6, 14);
                for (const step of rockKickPattern) {
                    builder.setStep('kick', barStart + step, 1.0);
                }

                // Rock backbeat
                builder.setStep('snare', barStart + 4, 1.0);
                builder.setStep('snare', barStart + 12, 1.0);

                // Steady eighth-note hi-hats
                for (let i = 0; i < STEPS_PER_BAR; i += 2) {
                    builder.setStep('hat', barStart + i, 0.7);
                }

                if (prob(0.4)) builder.setStep('openhat', barStart + 14, 0.75);
                break;

            case 'MAFIA':
                // Waltz pattern (3/4 feel in 4/4)
                builder.setStep('kick', barStart, 1.0);

                // Brush-style snare
                builder.setStep('snare', barStart + 4, 0.4);

                // Subtle hi-hat
                if (variation === 'B') {
                    for (let i = 0; i < STEPS_PER_BAR; i += 4) {
                        builder.setStep('hat', barStart + i, 0.3);
                    }
                }
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
        
        // --- Advanced Melodic Content with Contour-based Generation ---
        if (variation === 'A') {
            // Sparser A section with arpeggios
            const arpPattern = style === 'TRAP' ? [0, 4, 7, 10, 14] : [0, 4, 8, 12];
            const arpNotes = generateMelodicLine(arpPattern.length, chordNotes, key, 5, scale, 'ascending');
            arpPattern.forEach((step, idx) => {
                if(prob(0.75)) {
                    builder.setStep('arp', barStart + step, 0.7, arpNotes[idx]);
                }
            });
        } else {
            // Denser B section with advanced melodic development
            const melodyRhythm = style === 'TRAP'
                ? [0, 3, 6, 9, 12]
                : choice([[0, 6, 10], [0, 3, 7, 13], [0, 2, 4, 6, 8, 10, 12, 14]]);

            // Use melodic contour for natural-sounding melodies
            const contour = choice<MelodicContour>(['arch', 'valley', 'ascending', 'descending']);
            const melodyNotes = generateMelodicLine(melodyRhythm.length, chordNotes, key, 4, scale, contour);

            melodyRhythm.forEach((step, idx) => {
                if(prob(0.85)) {
                    builder.setStep('melody', barStart + step, 0.8, melodyNotes[idx]);
                }
            });

            // Add lead line with counter-melody (opposite contour)
            const leadRhythm = style === 'CINEMATIC' ? [0, 8, 12] : [0, 6, 10];
            const leadContour = contour === 'ascending' ? 'descending' : 'ascending';
            const leadNotes = generateMelodicLine(leadRhythm.length, chordNotes, key, 5, scale, leadContour);

            leadRhythm.forEach((step, idx) => {
                if(prob(0.7)) {
                    builder.setStep('lead', barStart + step, 0.9, leadNotes[idx]);
                }
            });
        }
    }
}