import { StoreState, Track } from '../types';
import { STEPS_PER_BAR } from '../constants';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteFrequencies: { [note: string]: number } = {};
for (let octave = 0; octave < 8; octave++) {
  for (let i = 0; i < 12; i++) {
    const note = NOTES[i];
    const freq = 16.35 * Math.pow(2, octave + i / 12);
    noteFrequencies[`${note}${octave}`] = freq;
  }
}

const noteToFrequency = (note: string): number => {
    return noteFrequencies[note] || 440;
};

const noteToMidi = (note: string): number => {
    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 60; // Default to C4 if parsing fails
    const key = match[1];
    const octave = parseInt(match[2], 10);
    const keyIndex = NOTES.indexOf(key);
    return keyIndex + (octave + 1) * 12;
}


const getChordFrequencies = (rootFreq: number, type: 'minor' | 'major'): number[] => {
    const ratios = type === 'minor' 
        ? [1, Math.pow(2, 3/12), Math.pow(2, 7/12)] 
        : [1, Math.pow(2, 4/12), Math.pow(2, 7/12)];
    return ratios.map(r => rootFreq * r);
};

function makeDistortionCurve(amount: number = 50): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; i++) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

export class AudioEngine {
    private audioContext: AudioContext;
    private getState: () => StoreState;
    private schedulerTimer: number | null = null;
    private nextNoteTime: number = 0.0;
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // seconds
    private sampleBuffers: Map<string, AudioBuffer>;
    private animationFrameId: number | null = null;

    private songPosition: number = 0; // In steps, relative to the whole arrangement

    // Professional Effects Chain
    private masterCompressor: DynamicsCompressorNode;
    private masterReverb: ConvolverNode;
    private masterDelay: DelayNode;
    private delayFeedback: GainNode;
    private reverbMix: GainNode;
    private delayMix: GainNode;
    private dryGain: GainNode;
    private masterFilter: BiquadFilterNode;
    private masterLimiter: DynamicsCompressorNode;
    private masterGain: GainNode;

    constructor(audioContext: AudioContext, getState: () => StoreState, sampleBuffers: Map<string, AudioBuffer>) {
        this.audioContext = audioContext;
        this.getState = getState;
        this.sampleBuffers = sampleBuffers;

        // Initialize professional master effects chain
        this.initializeMasterEffects();
    }

    private initializeMasterEffects() {
        // Master Compressor (glues everything together)
        this.masterCompressor = this.audioContext.createDynamicsCompressor();
        this.masterCompressor.threshold.value = -24;
        this.masterCompressor.knee.value = 30;
        this.masterCompressor.ratio.value = 3;
        this.masterCompressor.attack.value = 0.003;
        this.masterCompressor.release.value = 0.25;

        // Reverb setup
        this.masterReverb = this.audioContext.createConvolver();
        this.masterReverb.buffer = this.createReverbImpulse(2, 2.5, false);
        this.reverbMix = this.audioContext.createGain();
        this.reverbMix.gain.value = 0.15; // 15% wet

        // Delay setup (eighth note delay)
        this.masterDelay = this.audioContext.createDelay(5.0);
        this.masterDelay.delayTime.value = 0.375; // Will be tempo-synced
        this.delayFeedback = this.audioContext.createGain();
        this.delayFeedback.gain.value = 0.3;
        this.delayMix = this.audioContext.createGain();
        this.delayMix.gain.value = 0.2; // 20% wet

        // Dry signal
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 0.7;

        // Master Filter (for creative sweeps)
        this.masterFilter = this.audioContext.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.value = 20000; // Fully open by default
        this.masterFilter.Q.value = 1;

        // Master Limiter (prevents clipping)
        this.masterLimiter = this.audioContext.createDynamicsCompressor();
        this.masterLimiter.threshold.value = -3;
        this.masterLimiter.knee.value = 0;
        this.masterLimiter.ratio.value = 20;
        this.masterLimiter.attack.value = 0.001;
        this.masterLimiter.release.value = 0.1;

        // Master Gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;

        // Connect delay feedback loop
        this.masterDelay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.masterDelay);

        // Connect effects chain:
        // dry -> compressor
        // compressor -> reverb -> reverbMix
        // compressor -> delay -> delayMix
        // reverbMix + delayMix + dryGain -> filter -> limiter -> master gain -> destination
        this.masterCompressor.connect(this.masterReverb);
        this.masterReverb.connect(this.reverbMix);

        this.masterCompressor.connect(this.masterDelay);
        this.masterDelay.connect(this.delayMix);

        this.masterCompressor.connect(this.dryGain);

        this.reverbMix.connect(this.masterFilter);
        this.delayMix.connect(this.masterFilter);
        this.dryGain.connect(this.masterFilter);

        this.masterFilter.connect(this.masterLimiter);
        this.masterLimiter.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
    }

    private createReverbImpulse(duration: number, decay: number, reverse: boolean = false): AudioBuffer {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = reverse ? length - i : i;
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    }

    public setReverbAmount(amount: number) {
        this.reverbMix.gain.setValueAtTime(amount, this.audioContext.currentTime);
    }

    public setDelayAmount(amount: number) {
        this.delayMix.gain.setValueAtTime(amount, this.audioContext.currentTime);
    }

    public setDelayTime(beats: number) {
        const tempo = this.getState().tempo;
        const delayTime = (60 / tempo) * beats;
        this.masterDelay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
    }

    public setMasterFilter(frequency: number, q: number = 1) {
        this.masterFilter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        this.masterFilter.Q.value = q;
    }

    private scheduleNote(step: number, time: number) {
        const { tracks, sections, arrangement } = this.getState();
        
        // Find which section and local step this global step corresponds to
        let stepsIntoArrangement = 0;
        let currentSectionId = null;
        let localStep = 0;

        for (const sectionId of arrangement) {
            const section = sections[sectionId];
            if (!section) continue;
            const sectionSteps = section.bars * STEPS_PER_BAR;
            if (step >= stepsIntoArrangement && step < stepsIntoArrangement + sectionSteps) {
                currentSectionId = sectionId;
                localStep = step - stepsIntoArrangement;
                break;
            }
            stepsIntoArrangement += sectionSteps;
        }

        if (!currentSectionId) return;

        const pattern = sections[currentSectionId].pattern;
        
        const hasSolo = tracks.some(t => t.solo);

        const humanizeOffset = (Math.random() - 0.5) * 0.01; // +/- 5ms
        const scheduledTime = Math.max(time + humanizeOffset, this.audioContext.currentTime);

        tracks.forEach((track, trackIndex) => {
            if (track.mute || (hasSolo && !track.solo)) {
                return;
            }

            const stepData = pattern[trackIndex]?.[localStep];
            if (stepData && stepData.isActive) {
                const volume = stepData.velocity * track.volume;
                this.playSound(track, scheduledTime, volume, stepData.note);
            }
        });
    }

    private playSample(instrumentId: string, time: number, volume: number, pan: number, note: string | null) {
        const buffer = this.sampleBuffers.get(instrumentId);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // PITCHING LOGIC for pitched samples
        if (instrumentId === 'bass_808_sampled' && note) {
            const baseMidiNote = noteToMidi('C2'); // The 808 sample is C2
            const targetMidiNote = noteToMidi(note);
            const semitoneDiff = targetMidiNote - baseMidiNote;
            source.playbackRate.value = Math.pow(2, semitoneDiff / 12);
        }

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, time);
        
        const pannerNode = this.audioContext.createStereoPanner();
        pannerNode.pan.setValueAtTime(pan, time);

        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterCompressor);
        source.start(time);
    }
    
    private playSound(track: Track, time: number, volume: number, note: string | null) {
        const { activeInstrumentId, pan } = track;
        
        // --- SAMPLE-BASED INSTRUMENT LOGIC ---
        if (this.sampleBuffers.has(activeInstrumentId)) {
            this.playSample(activeInstrumentId, time, volume, pan, note);
            return;
        }

        // --- SYNTHESIS LOGIC (Fallback) ---
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const pannerNode = this.audioContext.createStereoPanner();

        pannerNode.pan.setValueAtTime(pan, time);

        osc.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterCompressor);

        let duration = 0.1;
        let playOsc = true;

        switch(activeInstrumentId) {
            // --- Kicks ---
            case 'kick_808':
            case 'kick_grit':
                duration = 0.15;
                if (activeInstrumentId === 'kick_grit') {
                    const gritOsc = this.audioContext.createOscillator();
                    gritOsc.type = 'square';
                    gritOsc.frequency.setValueAtTime(150, time);
                    gritOsc.frequency.exponentialRampToValueAtTime(0.01, time + duration * 0.7);
                    const gritGain = this.audioContext.createGain();
                    gritGain.gain.setValueAtTime(volume * 0.3, time);
                    gritGain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.7);
                    gritOsc.connect(gritGain).connect(pannerNode);
                    gritOsc.start(time);
                    gritOsc.stop(time + duration);
                }
                osc.frequency.setValueAtTime(150, time);
                osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
                gainNode.gain.setValueAtTime(volume, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
                break;
            case 'kick_rock':
                duration = 0.15;
                this.playNoise(0.02, time, volume * 0.2, pan, 'highpass', 5000); // click
                osc.frequency.setValueAtTime(120, time);
                osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
                gainNode.gain.setValueAtTime(volume * 1.2, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
                break;
            // --- Snares & Claps ---
            case 'snare_808':
            case 'snare_noisy':
                duration = 0.1;
                const noiseVolume = activeInstrumentId === 'snare_noisy' ? volume * 1.0 : volume * 0.8;
                const noiseFilterFreq = activeInstrumentId === 'snare_noisy' ? 1500 : 1000;
                this.playNoise(duration, time, noiseVolume, pan, 'highpass', noiseFilterFreq);
                osc.frequency.setValueAtTime(440, time);
                osc.frequency.exponentialRampToValueAtTime(220, time + duration);
                gainNode.gain.setValueAtTime(volume, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
                break;
            case 'snare_rock':
                duration = 0.18;
                this.playNoise(duration, time, volume, pan, 'bandpass', 2000);
                osc.frequency.setValueAtTime(250, time);
                osc.frequency.exponentialRampToValueAtTime(150, time + duration * 0.5);
                gainNode.gain.setValueAtTime(volume * 0.8, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.5);
                break;
            case 'clap_808':
                duration = 0.12;
                this.playNoise(duration, time, volume, pan, 'bandpass', 1500);
                playOsc = false;
                break;
            case 'orch_hit':
                duration = 1.0;
                playOsc = false;
                for (let i = 0; i < 6; i++) {
                    const hitOsc = this.audioContext.createOscillator();
                    hitOsc.type = 'sawtooth';
                    const freq = noteToFrequency('C4') * (1 + (Math.random() - 0.5) * 0.05);
                    hitOsc.frequency.setValueAtTime(freq * (i+1) * 0.5, time);
                    const hitGain = this.audioContext.createGain();
                    hitGain.gain.setValueAtTime(volume * 0.5, time);
                    hitGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                    hitOsc.connect(hitGain).connect(pannerNode);
                    hitOsc.start(time);
                    hitOsc.stop(time + duration);
                }
                break;
            // --- Hats & Perc ---
            case 'hat_closed':
            case 'hat_grit':
                duration = 0.05;
                const hatFilter = activeInstrumentId === 'hat_grit' ? 'bandpass' : 'highpass';
                const hatFreq = activeInstrumentId === 'hat_grit' ? 10000 : 7000;
                this.playNoise(duration, time, volume * 0.8, pan, hatFilter, hatFreq);
                playOsc = false;
                break;
            case 'hat_open':
                duration = 0.4;
                this.playNoise(duration, time, volume * 0.8, pan, 'highpass', 7000);
                playOsc = false;
                break;
            case 'perc_hit':
                duration = 0.1;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, time);
                osc.frequency.exponentialRampToValueAtTime(440, time + duration);
                gainNode.gain.setValueAtTime(volume, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
                break;
            case 'timpani':
                duration = 1.0;
                osc.type = 'sine';
                if(note) {
                    const freq = noteToFrequency(note);
                    osc.frequency.setValueAtTime(freq * 1.02, time); // slight pitch drop
                    osc.frequency.exponentialRampToValueAtTime(freq, time + duration);
                    gainNode.gain.setValueAtTime(volume, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
                } else {
                    playOsc = false;
                }
                break;
            // --- Bass ---
            case 'bass_808':
            case 'bass_saw':
            case 'bass_sub':
                duration = 0.3;
                if (note) {
                    const freq = noteToFrequency(note);
                    if (activeInstrumentId === 'bass_saw') {
                        osc.type = 'sawtooth';
                        const filter = this.audioContext.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(freq * 2.5, time);
                        filter.Q.value = 1.2;
                        osc.connect(filter);
                        filter.connect(gainNode);
                    } else {
                         osc.type = 'sine';
                    }
                    osc.frequency.setValueAtTime(freq, time);
                    gainNode.gain.setValueAtTime(volume, time);
                    gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
                } else {
                    playOsc = false;
                }
                break;
            // --- Melodic ---
            case 'melody_triangle':
            case 'melody_saw':
            case 'melody_square':
                 duration = 0.3;
                if (note) {
                    osc.type = activeInstrumentId.includes('saw') ? 'sawtooth' : activeInstrumentId.includes('square') ? 'square' : 'triangle';
                    const freq = noteToFrequency(note);
                    osc.frequency.setValueAtTime(freq, time);
                    gainNode.gain.setValueAtTime(volume, time);
                    gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
                } else {
                    playOsc = false;
                }
                break;
            case 'harpsichord':
                 duration = 0.5;
                 playOsc = false;
                 if (note) {
                    const freq = noteToFrequency(note);
                    const hGain = this.audioContext.createGain();
                    hGain.gain.setValueAtTime(volume, time);
                    hGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                    hGain.connect(pannerNode);

                    const osc1 = this.audioContext.createOscillator();
                    osc1.type = 'sawtooth';
                    osc1.frequency.value = freq;
                    osc1.connect(hGain);
                    osc1.start(time);
                    osc1.stop(time+duration);

                    const osc2 = this.audioContext.createOscillator();
                    osc2.type = 'square';
                    osc2.frequency.value = freq * 2; // Octave up
                    osc2.connect(hGain);
                    osc2.start(time);
                    osc2.stop(time+duration);
                 }
                break;
            case 'piano_grand':
                duration = 1.5;
                if (note) {
                    const freq = noteToFrequency(note);
                    const osc1 = this.audioContext.createOscillator();
                    const osc2 = this.audioContext.createOscillator();
                    osc1.type = 'sine';
                    osc2.type = 'triangle';
                    osc1.frequency.setValueAtTime(freq, time);
                    osc2.frequency.setValueAtTime(freq * 2, time);
                    
                    const pianoGain = this.audioContext.createGain();
                    pianoGain.gain.setValueAtTime(volume, time);
                    pianoGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                    osc1.connect(pianoGain).connect(pannerNode);
                    osc2.connect(pianoGain).connect(pannerNode);

                    osc1.start(time);
                    osc2.start(time);
                    osc1.stop(time + duration);
                    osc2.stop(time + duration);
                }
                playOsc = false;
                break;
            case 'mandolin_tremolo':
                duration = (60 / this.getState().tempo) * 2;
                playOsc = false;
                if(note) {
                    const freq = noteToFrequency(note);
                    const tremolo = this.audioContext.createOscillator();
                    tremolo.type = 'sine';
                    tremolo.frequency.value = 8;
                    const tremoloGain = this.audioContext.createGain();
                    tremoloGain.gain.value = 0.4;
                    tremolo.connect(tremoloGain.gain);
                    const mainGain = this.audioContext.createGain();
                    mainGain.gain.setValueAtTime(0, time);
                    mainGain.gain.linearRampToValueAtTime(volume, time + 0.05);
                    mainGain.gain.setValueAtTime(volume, time + duration - 0.1);
                    mainGain.gain.linearRampToValueAtTime(0, time + duration);
                    for(let i=0; i<2; i++) {
                        const mOsc = this.audioContext.createOscillator();
                        mOsc.type = 'square';
                        mOsc.frequency.value = freq * (1 + i * 0.005);
                        mOsc.connect(mainGain);
                        mOsc.start(time);
                        mOsc.stop(time + duration);
                    }
                    tremoloGain.connect(mainGain.gain);
                    mainGain.connect(pannerNode);
                    tremolo.start(time);
                    tremolo.stop(time + duration);
                }
                break;
            case 'accordion':
                duration = (60 / this.getState().tempo) * 4;
                playOsc = false;
                if(note) {
                    const freq = noteToFrequency(note);
                    const chordFreqs = getChordFrequencies(freq, 'major');
                    const accordionGain = this.audioContext.createGain();
                    accordionGain.gain.setValueAtTime(0, time);
                    accordionGain.gain.linearRampToValueAtTime(volume * 0.7, time + 0.3);
                    accordionGain.gain.linearRampToValueAtTime(0, time + duration);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 2500;
                    accordionGain.connect(filter).connect(pannerNode);
                    chordFreqs.forEach(f => {
                       for(let i=0; i<3; i++) {
                           const aOsc = this.audioContext.createOscillator();
                           aOsc.type = 'sawtooth';
                           aOsc.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
                           aOsc.connect(accordionGain);
                           aOsc.start(time);
                           aOsc.stop(time + duration);
                       }
                    });
                }
                break;
            case 'strings_legato':
                duration = (60 / this.getState().tempo) * 4;
                if (note) {
                    const freq = noteToFrequency(note);
                    const osc1 = this.audioContext.createOscillator();
                    const osc2 = this.audioContext.createOscillator();
                    osc1.type = 'sawtooth';
                    osc2.type = 'sawtooth';
                    osc1.frequency.setValueAtTime(freq, time);
                    osc2.frequency.setValueAtTime(freq * 1.005, time);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(1000, time);
                    filter.frequency.exponentialRampToValueAtTime(800, time + duration * 0.5);
                    gainNode.gain.setValueAtTime(0, time);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, time + 0.2); 
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, time + duration - 0.5);
                    gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
                    osc1.connect(filter);
                    osc2.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(pannerNode);
                    pannerNode.connect(this.masterCompressor);
                    osc1.start(time);
                    osc2.start(time);
                    osc1.stop(time + duration);
                    osc2.stop(time + duration);
                }
                playOsc = false;
                break;
            case 'violin_section':
                duration = (60 / this.getState().tempo) * 4;
                 if (note) {
                    const rootFreq = noteToFrequency(note);
                    const chordFreqs = getChordFrequencies(rootFreq, 'minor');
                    const chordGain = this.audioContext.createGain();
                    chordGain.gain.setValueAtTime(0, time);
                    chordGain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.3);
                    chordGain.gain.linearRampToValueAtTime(0.001, time + duration);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 2000;
                    filter.Q.value = 1.5;
                    chordGain.connect(filter).connect(pannerNode);
                    chordFreqs.forEach(freq => {
                        for(let i = 0; i < 3; i++) {
                           const vOsc = this.audioContext.createOscillator();
                           vOsc.type = 'sawtooth';
                           vOsc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.01);
                           vOsc.connect(chordGain);
                           vOsc.start(time);
                           vOsc.stop(time + duration);
                        }
                    });
                }
                playOsc = false;
                break;
             case 'strings_pizzicato':
                duration = 0.2;
                if (note) {
                    const freq = noteToFrequency(note);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, time);
                    gainNode.gain.setValueAtTime(volume, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
                } else {
                    playOsc = false;
                }
                break;
            case 'french_horn':
                duration = (60 / this.getState().tempo) * 2;
                playOsc = false;
                if (note) {
                    const freq = noteToFrequency(note);
                    const hornGain = this.audioContext.createGain();
                    hornGain.gain.setValueAtTime(0, time);
                    hornGain.gain.linearRampToValueAtTime(volume * 0.8, time + 0.15); // Brassy attack
                    hornGain.gain.linearRampToValueAtTime(0.001, time + duration);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 1500;
                    hornGain.connect(filter).connect(pannerNode);
                    for (let i = 0; i < 3; i++) {
                        const hOsc = this.audioContext.createOscillator();
                        hOsc.type = 'sawtooth';
                        hOsc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.01);
                        hOsc.connect(hornGain);
                        hOsc.start(time);
                        hOsc.stop(time + duration);
                    }
                }
                break;
            case 'choir_aahs':
            case 'pad_sine':
            case 'filter_sweep_pad':
                 duration = (60 / this.getState().tempo) * 4;
                 playOsc = false;
                 if (note) {
                    const freq = noteToFrequency(note);
                    const padGain = this.audioContext.createGain();
                    padGain.gain.setValueAtTime(0, time);
                    padGain.gain.linearRampToValueAtTime(volume, time + 0.8); // Slow attack
                    padGain.gain.linearRampToValueAtTime(0.001, time + duration);
                    
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = activeInstrumentId === 'choir_aahs' ? 2000 : 1200;
                    if(activeInstrumentId === 'filter_sweep_pad') {
                        filter.frequency.setValueAtTime(200, time);
                        filter.frequency.exponentialRampToValueAtTime(3000, time + duration);
                    }
                    
                    padGain.connect(filter).connect(pannerNode);
                    
                    const numOscs = activeInstrumentId === 'pad_sine' ? 1 : 4;
                    const oscType = activeInstrumentId === 'pad_sine' ? 'sine' : 'sawtooth';
                    for (let i = 0; i < numOscs; i++) {
                        const pOsc = this.audioContext.createOscillator();
                        pOsc.type = oscType;
                        pOsc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.01);
                        pOsc.connect(padGain);
                        pOsc.start(time);
                        pOsc.stop(time + duration);
                    }
                }
                break;
            case 'opera_vocal':
                duration = (60 / this.getState().tempo) * 4;
                playOsc = false;
                if (note) {
                    const freq = noteToFrequency(note);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 1500;
                    filter.Q.value = 2;
                    gainNode.gain.setValueAtTime(0, time);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, time + 0.8);
                    gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
                    filter.connect(gainNode).connect(pannerNode);
                    for(let i=0; i<3; i++) {
                        const oOsc = this.audioContext.createOscillator();
                        oOsc.type = 'sawtooth';
                        oOsc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.02);
                        oOsc.connect(filter);
                        oOsc.start(time);
                        oOsc.stop(time + duration);
                    }
                }
                break;
            case 'arp_triangle':
                duration = 0.15;
                if (note) {
                    const freq = noteToFrequency(note);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, time);
                    gainNode.gain.setValueAtTime(volume, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
                } else {
                    playOsc = false;
                }
                break;
            case 'lead_saw':
            case 'lead_square':
                 duration = 0.4;
                 playOsc = false;
                 if (note) {
                    const freq = noteToFrequency(note);
                    const osc1 = this.audioContext.createOscillator();
                    const osc2 = this.audioContext.createOscillator();
                    osc1.type = activeInstrumentId.includes('saw') ? 'sawtooth' : 'square';
                    osc2.type = activeInstrumentId.includes('saw') ? 'sawtooth' : 'square';
                    osc1.frequency.setValueAtTime(freq, time);
                    osc2.frequency.setValueAtTime(freq * 0.995, time);
                    gainNode.gain.setValueAtTime(0, time);
                    gainNode.gain.linearRampToValueAtTime(volume, time + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, time + 0.2);
                    gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
                    osc1.connect(gainNode);
                    osc2.connect(gainNode);
                    gainNode.connect(pannerNode);
                    pannerNode.connect(this.masterCompressor);
                    osc1.start(time);
                    osc2.start(time);
                    osc1.stop(time + duration);
                    osc2.stop(time + duration);
                }
                break;
             case 'guitar_distorted':
                duration = 0.8;
                playOsc = false;
                if(note) {
                    const rootFreq = noteToFrequency(note);
                    const fifthFreq = rootFreq * 1.5;
                    const freqs = [rootFreq, fifthFreq];
                    const distortion = this.audioContext.createWaveShaper();
                    distortion.curve = makeDistortionCurve(200);
                    distortion.oversample = '4x';
                    const guitarGain = this.audioContext.createGain();
                    guitarGain.gain.setValueAtTime(volume * 0.5, time);
                    guitarGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 3000;
                    guitarGain.connect(distortion).connect(filter).connect(pannerNode);
                    freqs.forEach(f => {
                        const gOsc = this.audioContext.createOscillator();
                        gOsc.type = 'sawtooth';
                        gOsc.frequency.value = f;
                        gOsc.connect(guitarGain);
                        gOsc.start(time);
                        gOsc.stop(time + duration);
                    });
                }
                break;
            default:
                playOsc = false;
                break;
        }

        if (playOsc) {
            osc.start(time);
            osc.stop(time + duration);
        }
    }

    public triggerSound(track: Track, velocity: number, note: string | null) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (track) {
            const volume = velocity * track.volume;
            this.playSound(track, this.audioContext.currentTime, volume, note);
        }
    }

    private playNoise(duration: number, time: number, volume: number, pan: number, filterType?: BiquadFilterType, filterFreq: number = 3000) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        const pannerNode = this.audioContext.createStereoPanner();
        pannerNode.pan.setValueAtTime(pan, time);
        let lastNode: AudioNode = noiseSource;
        if (filterType) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.value = filterFreq;
            lastNode.connect(filter);
            lastNode = filter;
        }
        lastNode.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterCompressor);
        noiseSource.start(time);
        noiseSource.stop(time + duration);
    }

    private scheduler() {
        const { arrangement, sections } = this.getState();
        const totalArrangementSteps = arrangement.reduce((sum, sectionId) => {
            const section = sections[sectionId];
            return sum + (section ? section.bars * STEPS_PER_BAR : 0);
        }, 0);

        if (totalArrangementSteps === 0) {
            if (this.getState().isPlaying) this.getState().stopPlayback();
            return;
        }

        let notesScheduledThisCall = 0;
        // Robust scheduling loop
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            // Add a breaker to prevent the loop from running for too long and freezing the UI,
            // which can happen when refocusing a backgrounded tab.
            if (notesScheduledThisCall++ > 50) {
                break;
            }

            this.scheduleNote(this.songPosition, this.nextNoteTime);
            
            const { tempo, swing } = this.getState();
            const secondsPerStep = 60.0 / tempo / 4.0; // 16th note duration
            
            if (this.songPosition % 2 !== 0) { // Off-beat swing
                this.nextNoteTime += secondsPerStep * 2 * swing;
            } else { // On-beat
                this.nextNoteTime += secondsPerStep * 2 * (1 - swing);
            }
            
            this.songPosition = (this.songPosition + 1) % totalArrangementSteps;
        }

        this.schedulerTimer = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    private uiUpdater = () => {
        if (!this.getState().isPlaying) return;
        this.getState()._setCurrentStep(this.songPosition);
        this.animationFrameId = window.requestAnimationFrame(this.uiUpdater);
    }

    public start() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        // Clean up any previous timers to prevent duplicates
        if (this.schedulerTimer) clearTimeout(this.schedulerTimer);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

        this.nextNoteTime = this.audioContext.currentTime;
        
        const lastStep = this.getState().currentStep;
        this.songPosition = lastStep >= 0 ? lastStep : 0;
        
        this.scheduler();
        this.animationFrameId = window.requestAnimationFrame(this.uiUpdater);
    }

    public stop() {
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Don't reset the step here, allow the store action to handle it
        // This lets playback be paused and resumed.
    }

    public close() {
        this.stop();
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.error);
        }
    }
}