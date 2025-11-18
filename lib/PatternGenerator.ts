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
        if (step % STEPS_PER_BAR === 0) vel *= randInRange(1.05, 1.15); // Strong downbeat accent
        else if (step % 8 === 0) vel *= randInRange(1.0, 1.08); // Beat 3 accent
        else if (step % 4 === 0) vel *= randInRange(0.98, 1.03); // Quarter note accent
        else vel *= randInRange(0.88, 0.96); // Lighter off-beats
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

    // --- Generate in proper order: Drums → Bass → Harmony → Melody ---
    generateDrums(builder, bars, style, variation);
    generateBass(builder, bars, style, barChords, key, scale, variation);
    generateHarmony(builder, bars, style, barChords, key, scale, variation);
    generateMelody(builder, bars, style, barChords, key, scale, variation);

    return builder.build();
}

// --- DRUM GENERATION ---
function generateDrums(builder: PatternBuilder, bars: number, style: BeatStyle, variation: 'A' | 'B') {
    switch(style) {
        case 'TRAP':
            generateTrapDrums(builder, bars, variation);
            break;
        case 'DETROIT':
            generateDetroitDrums(builder, bars, variation);
            break;
        case 'FLINT':
            generateFlintDrums(builder, bars, variation);
            break;
        case 'CINEMATIC':
            generateCinematicDrums(builder, bars, variation);
            break;
        case 'ROCK':
            generateRockDrums(builder, bars, variation);
            break;
        case 'MAFIA':
            generateMafiaDrums(builder, bars, variation);
            break;
    }
}

function generateTrapDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const isSecondHalf = bar >= bars / 2;

        // Kick: Sparse but hard-hitting (authentic trap)
        const kickPattern = variation === 'A'
            ? [0, 6]
            : (isSecondHalf ? [0, 6, 10, 13] : [0, 6, 10]);

        for (const step of kickPattern) {
            builder.setStep('kick', barStart + step, 1.0);
        }

        // Snare on beat 3 (step 8) - Detroit signature, not typical trap
        builder.setStep('snare', barStart + 8, 1.0);

        // Rapid hi-hats with rolls at phrase endings
        for (let i = 0; i < STEPS_PER_BAR; i++) {
            if (i % 2 === 0) {
                const vel = (i % 4 === 0) ? randInRange(0.6, 0.75) : randInRange(0.5, 0.65);
                builder.setStep('hat', barStart + i, vel);
            }
        }

        // Hi-hat rolls at end of 2-bar phrases
        if (bar % 2 === 1 || (isSecondHalf && prob(0.5))) {
            const rollStart = 13;
            for (let i = 0; i < 3; i++) {
                builder.setStep('hat', barStart + rollStart + i, randInRange(0.55, 0.7));
            }
        }

        // Open hat accents
        if (prob(0.4)) {
            builder.setStep('openhat', barStart + choice([6, 10, 14]), 0.65);
        }

        // Extra percussion in second half for build-up
        if (isSecondHalf && prob(0.5)) {
            builder.setStep('perc', barStart + choice([4, 7, 11]), 0.75);
        }
    }
}

function generateDetroitDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const isSecondHalf = bar >= bars / 2;

        // Detroit bounce pattern - the signature groove
        const kickPattern = variation === 'A'
            ? [0, 6, 10]
            : (isSecondHalf ? [0, 3, 6, 9, 10, 14] : [0, 3, 6, 10, 14]);

        for (const step of kickPattern) {
            builder.setStep('kick', barStart + step, 1.0);
        }

        // Snare on 3 (Detroit style)
        builder.setStep('snare', barStart + 8, 1.0);
        if (variation === 'B') {
            builder.setStep('snare', barStart + 12, 0.85);
        }

        // Dense, driving hi-hats
        for (let i = 0; i < STEPS_PER_BAR; i++) {
            if (variation === 'B' || i % 2 === 0) {
                builder.setStep('hat', barStart + i, randInRange(0.6, 0.75));
            }
        }

        // Open hat accents on upbeats
        if (variation === 'B' && prob(0.6)) {
            builder.setStep('openhat', barStart + 14, 0.7);
        }

        // Ghost notes
        if (prob(0.3)) {
            builder.setStep('snare', barStart + choice([5, 7, 13]), 0.25);
        }
    }
}

function generateFlintDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const isSecondHalf = bar >= bars / 2;

        // Flint aggressive bounce
        const kickPattern = variation === 'A'
            ? [0, 7, 11]
            : (isSecondHalf ? [0, 5, 7, 11, 14] : [0, 7, 11, 14]);

        for (const step of kickPattern) {
            builder.setStep('kick', barStart + step, 1.0);
        }

        // Hard snare
        builder.setStep('snare', barStart + 8, 1.0);
        if (variation === 'B') {
            builder.setStep('snare', barStart + 12, 0.9);
        }

        // Bouncy hats
        for (let i = 0; i < STEPS_PER_BAR; i += 2) {
            builder.setStep('hat', barStart + i, randInRange(0.65, 0.8));
        }

        // Percussion layers for energy
        builder.setStep('perc', barStart + choice([3, 7, 11]), 0.8);
        if (isSecondHalf) {
            builder.setStep('perc', barStart + choice([5, 9, 13]), 0.75);
        }
    }
}

function generateCinematicDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;

        builder.setStep('kick', barStart, 1.0);
        if (variation === 'B') {
            builder.setStep('kick', barStart + 8, 0.85);
            if (prob(0.6)) builder.setStep('kick', barStart + 10, 0.9);
        }

        // Sparse, cinematic snare
        const snareStep = variation === 'A' ? 8 : 8;
        builder.setStep('snare', barStart + snareStep, 1.0);
        if (variation === 'B') {
            builder.setStep('snare', barStart + 12, 0.9);
        }

        // Minimal hats
        for (let i = 0; i < STEPS_PER_BAR; i += 4) {
            builder.setStep('hat', barStart + i, 0.5);
        }
    }
}

function generateRockDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;

        // Four-on-the-floor variation
        for (let i = 0; i < STEPS_PER_BAR; i += 4) {
            builder.setStep('kick', barStart + i, 1.0);
        }

        // Backbeat snare
        builder.setStep('snare', barStart + 4, 1.0);
        builder.setStep('snare', barStart + 12, 1.0);

        // Eighth-note hats
        for (let i = 0; i < STEPS_PER_BAR; i += 2) {
            builder.setStep('hat', barStart + i, 0.7);
        }

        if (prob(0.4)) {
            builder.setStep('openhat', barStart + 14, 0.7);
        }
    }
}

function generateMafiaDrums(builder: PatternBuilder, bars: number, variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;

        // Waltz kick (3/4 time in 4/4)
        builder.setStep('kick', barStart, 1.0);

        // Waltz snare pattern
        builder.setStep('snare', barStart + 4, 1.0);
        builder.setStep('snare', barStart + 8, 0.9);
    }
}

// --- BASS GENERATION ---
function generateBass(builder: PatternBuilder, bars: number, style: BeatStyle, barChords: Chord[], key: string, scale: number[], variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const chord = barChords[bar];
        const isSecondHalf = bar >= bars / 2;

        // Get chord tones for bass notes
        const root = getNoteInScale(key, 2, scale, chord.degree);
        const fifth = getNoteInScale(key, 2, scale, chord.degree + 4);
        const third = getNoteInScale(key, 2, scale, chord.degree + 2);

        if (style === 'MAFIA') {
            // Waltz oom-pah pattern
            builder.setStep('bass', barStart, 1.0, root);
            builder.setStep('bass', barStart + 4, 0.8, fifth);
            builder.setStep('bass', barStart + 8, 0.8, fifth);
        } else if (style === 'TRAP') {
            // Bass complements kick but doesn't copy it
            // Use syncopated rhythm that grooves with drums
            const bassRhythm = variation === 'A'
                ? [0, 8]
                : (isSecondHalf ? [0, 3, 8, 11] : [0, 8, 11]);

            for (const step of bassRhythm) {
                const note = (step === 8 || step === 11) ? fifth : root;
                builder.setStep('bass', barStart + step, 1.0, note);
            }
        } else if (style === 'DETROIT' || style === 'FLINT') {
            // Driving bass that follows kick mostly but adds variation
            const kickSteps = [];
            for (let i = 0; i < STEPS_PER_BAR; i++) {
                const kickStep = builder.getStep('kick', barStart + i);
                if (kickStep?.isActive) kickSteps.push(i);
            }

            // Bass on most kick hits
            for (const step of kickSteps) {
                if (prob(0.85)) {
                    builder.setStep('bass', barStart + step, 1.0, root);
                }
            }

            // Add passing notes
            if (variation === 'B' && prob(0.6)) {
                const passingStep = choice([5, 7, 13]);
                if (!kickSteps.includes(passingStep)) {
                    builder.setStep('bass', barStart + passingStep, 0.8, third);
                }
            }
        } else {
            // Other styles: simple root on downbeat
            builder.setStep('bass', barStart, 1.0, root);
            if (variation === 'B') {
                builder.setStep('bass', barStart + 8, 0.9, root);
            }
        }
    }
}

// --- HARMONY GENERATION ---
function generateHarmony(builder: PatternBuilder, bars: number, style: BeatStyle, barChords: Chord[], key: string, scale: number[], variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const chord = barChords[bar];
        const padNote = getNoteInScale(key, 3, scale, chord.degree);

        // Pads & Strings (sustained harmony)
        if (style !== 'TRAP' || variation === 'B') {
            builder.setStep('pad', barStart, 0.6, padNote);
            builder.setStep('strings', barStart, 0.7, padNote);
        }
    }
}

// --- MELODY GENERATION ---
function generateMelody(builder: PatternBuilder, bars: number, style: BeatStyle, barChords: Chord[], key: string, scale: number[], variation: 'A' | 'B') {
    for (let bar = 0; bar < bars; bar++) {
        const barStart = bar * STEPS_PER_BAR;
        const chord = barChords[bar];
        const chordNotes = getChordNotes(key, 4, scale, chord);
        const isSecondHalf = bar >= bars / 2;

        if (variation === 'A') {
            // Sparse arpeggiated melody
            const arpPattern = style === 'TRAP' ? [0, 4, 7, 10, 14] : [0, 4, 8, 12];

            for (let i = 0; i < arpPattern.length; i++) {
                if (prob(0.7)) {
                    const note = chordNotes[i % chordNotes.length];
                    builder.setStep('arp', barStart + arpPattern[i], 0.7, note);
                }
            }
        } else {
            // Denser melodic content for B sections
            const melodyRhythm = style === 'TRAP'
                ? [0, 3, 6, 9, 12]
                : (isSecondHalf ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 3, 7, 10, 13]);

            for (let i = 0; i < melodyRhythm.length; i++) {
                if (prob(0.8)) {
                    // Create melodic contour by cycling through chord tones
                    const note = chordNotes[i % chordNotes.length];
                    builder.setStep('melody', barStart + melodyRhythm[i], 0.8, note);
                }
            }

            // Lead line on top
            const leadRhythm = isSecondHalf ? [0, 4, 6, 10, 14] : [0, 6, 10];
            const leadNotes = getChordNotes(key, 5, scale, chord);

            for (let i = 0; i < leadRhythm.length; i++) {
                if (prob(0.65)) {
                    const note = leadNotes[i % leadNotes.length];
                    builder.setStep('lead', barStart + leadRhythm[i], 0.9, note);
                }
            }
        }
    }
}
