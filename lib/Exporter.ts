// lib/Exporter.ts
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
  if (!match) return 60;
  const key = match[1];
  const octave = parseInt(match[2], 10);
  const keyIndex = NOTES.indexOf(key);
  return keyIndex + (octave + 1) * 12;
};

const getChordFrequencies = (rootFreq: number, type: 'minor' | 'major'): number[] => {
  const ratios = type === 'minor'
    ? [1, Math.pow(2, 3 / 12), Math.pow(2, 7 / 12)]
    : [1, Math.pow(2, 4 / 12), Math.pow(2, 7 / 12)];
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
}

function normalizeBuffer(buffer: AudioBuffer, targetDb = -0.5) {
  const targetGain = Math.pow(10, targetDb / 20);
  let maxGain = 0;

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const channelData = buffer.getChannelData(i);
    for (let j = 0; j < channelData.length; j++) {
      maxGain = Math.max(maxGain, Math.abs(channelData[j]));
    }
  }

  if (maxGain === 0) return;

  const gainCorrection = targetGain / maxGain;

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const channelData = buffer.getChannelData(i);
    for (let j = 0; j < channelData.length; j++) {
      channelData[j] *= gainCorrection;
    }
  }
}

class OfflineRenderer {
  private ctx: OfflineAudioContext;
  private storeState: StoreState;
  private sampleBuffers: Map<string, AudioBuffer>;

  constructor(ctx: OfflineAudioContext, storeState: StoreState, sampleBuffers: Map<string, AudioBuffer>) {
    this.ctx = ctx;
    this.storeState = storeState;
    this.sampleBuffers = sampleBuffers;
  }

  private playNoise(duration: number, time: number, volume: number, pan: number, filterType?: BiquadFilterType, filterFreq: number = 3000) {
    const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    const pannerNode = this.ctx.createStereoPanner();
    pannerNode.pan.setValueAtTime(pan, time);
    let lastNode: AudioNode = noiseSource;
    if (filterType) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      lastNode.connect(filter);
      lastNode = filter;
    }
    lastNode.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.ctx.destination);
    noiseSource.start(time);
    noiseSource.stop(time + duration);
  }

  private playSample(instrumentId: string, time: number, volume: number, pan: number, note: string | null) {
    const buffer = this.sampleBuffers.get(instrumentId);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    if (instrumentId === 'bass_808_sampled' && note) {
      const baseMidiNote = noteToMidi('C2');
      const targetMidiNote = noteToMidi(note);
      const semitoneDiff = targetMidiNote - baseMidiNote;
      source.playbackRate.value = Math.pow(2, semitoneDiff / 12);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, time);

    const pannerNode = this.ctx.createStereoPanner();
    pannerNode.pan.setValueAtTime(pan, time);

    source.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.ctx.destination);
    source.start(time);
  }

  private playSound(track: Track, time: number, volume: number, note: string | null) {
    const { activeInstrumentId, pan } = track;

    if (this.sampleBuffers.has(activeInstrumentId)) {
      this.playSample(activeInstrumentId, time, volume, pan, note);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const pannerNode = this.ctx.createStereoPanner();

    pannerNode.pan.setValueAtTime(pan, time);

    osc.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.ctx.destination);

    let duration = 0.1;
    let playOsc = true;

    const { tempo } = this.storeState;

    switch (activeInstrumentId) {
      case 'kick_808':
      case 'kick_grit':
        duration = 0.15;
        if (activeInstrumentId === 'kick_grit') {
          const gritOsc = this.ctx.createOscillator();
          gritOsc.type = 'square';
          gritOsc.frequency.setValueAtTime(150, time);
          gritOsc.frequency.exponentialRampToValueAtTime(0.01, time + duration * 0.7);
          const gritGain = this.ctx.createGain();
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
        this.playNoise(0.02, time, volume * 0.2, pan, 'highpass', 5000);
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
        gainNode.gain.setValueAtTime(volume * 1.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
        break;
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
          const hitOsc = this.ctx.createOscillator();
          hitOsc.type = 'sawtooth';
          const freq = noteToFrequency('C4') * (1 + (Math.random() - 0.5) * 0.05);
          hitOsc.frequency.setValueAtTime(freq * (i + 1) * 0.5, time);
          const hitGain = this.ctx.createGain();
          hitGain.gain.setValueAtTime(volume * 0.5, time);
          hitGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          hitOsc.connect(hitGain).connect(pannerNode);
          hitOsc.start(time);
          hitOsc.stop(time + duration);
        }
        break;
      case 'hat_closed':
      case 'hat_grit':
        duration = 0.05;
        const hatFilter = activeInstrumentId === 'hat_grit' ? 'bandpass' : 'highpass';
        const hatFreq = activeInstrumentId === 'hat_grit' ? 10000 : 7000;
        this.playNoise(duration, time, volume * 0.8, pan, hatFilter as BiquadFilterType, hatFreq);
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
        if (note) {
          const freq = noteToFrequency(note);
          osc.frequency.setValueAtTime(freq * 1.02, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + duration);
          gainNode.gain.setValueAtTime(volume, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        } else {
          playOsc = false;
        }
        break;
      case 'bass_808':
      case 'bass_saw':
      case 'bass_sub':
        duration = 0.3;
        if (note) {
          const freq = noteToFrequency(note);
          if (activeInstrumentId === 'bass_saw') {
            osc.type = 'sawtooth';
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(freq * 2.5, time);
            filter.Q.value = 1.2;
            osc.disconnect();
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
          const hGain = this.ctx.createGain();
          hGain.gain.setValueAtTime(volume, time);
          hGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          hGain.connect(pannerNode);

          const osc1 = this.ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc1.frequency.value = freq;
          osc1.connect(hGain);
          osc1.start(time);
          osc1.stop(time + duration);

          const osc2 = this.ctx.createOscillator();
          osc2.type = 'square';
          osc2.frequency.value = freq * 2;
          osc2.connect(hGain);
          osc2.start(time);
          osc2.stop(time + duration);
        }
        break;
      case 'piano_grand':
        duration = 1.5;
        if (note) {
          const freq = noteToFrequency(note);
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, time);
          osc2.frequency.setValueAtTime(freq * 2, time);

          const pianoGain = this.ctx.createGain();
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
      case 'strings_legato':
        duration = (60 / tempo) * 4;
        if (note) {
          const freq = noteToFrequency(note);
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc2.type = 'sawtooth';
          osc1.frequency.setValueAtTime(freq, time);
          osc2.frequency.setValueAtTime(freq * 1.005, time);
          const filter = this.ctx.createBiquadFilter();
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
          pannerNode.connect(this.ctx.destination);
          osc1.start(time);
          osc2.start(time);
          osc1.stop(time + duration);
          osc2.stop(time + duration);
        }
        playOsc = false;
        break;
      case 'violin_section':
        duration = (60 / tempo) * 4;
        if (note) {
          const rootFreq = noteToFrequency(note);
          const chordFreqs = getChordFrequencies(rootFreq, 'minor');
          const chordGain = this.ctx.createGain();
          chordGain.gain.setValueAtTime(0, time);
          chordGain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.3);
          chordGain.gain.linearRampToValueAtTime(0.001, time + duration);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 2000;
          filter.Q.value = 1.5;
          chordGain.connect(filter).connect(pannerNode);
          chordFreqs.forEach(freq => {
            for (let i = 0; i < 3; i++) {
              const vOsc = this.ctx.createOscillator();
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
        duration = (60 / tempo) * 2;
        playOsc = false;
        if (note) {
          const freq = noteToFrequency(note);
          const hornGain = this.ctx.createGain();
          hornGain.gain.setValueAtTime(0, time);
          hornGain.gain.linearRampToValueAtTime(volume * 0.8, time + 0.15);
          hornGain.gain.linearRampToValueAtTime(0.001, time + duration);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1500;
          hornGain.connect(filter).connect(pannerNode);
          for (let i = 0; i < 3; i++) {
            const hOsc = this.ctx.createOscillator();
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
        duration = (60 / tempo) * 4;
        playOsc = false;
        if (note) {
          const freq = noteToFrequency(note);
          const padGain = this.ctx.createGain();
          padGain.gain.setValueAtTime(0, time);
          padGain.gain.linearRampToValueAtTime(volume, time + 0.8);
          padGain.gain.linearRampToValueAtTime(0.001, time + duration);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = activeInstrumentId === 'choir_aahs' ? 2000 : 1200;
          if (activeInstrumentId === 'filter_sweep_pad') {
            filter.frequency.setValueAtTime(200, time);
            filter.frequency.exponentialRampToValueAtTime(3000, time + duration);
          }

          padGain.connect(filter).connect(pannerNode);

          const numOscs = activeInstrumentId === 'pad_sine' ? 1 : 4;
          const oscType = activeInstrumentId === 'pad_sine' ? 'sine' : 'sawtooth';
          for (let i = 0; i < numOscs; i++) {
            const pOsc = this.ctx.createOscillator();
            pOsc.type = oscType;
            pOsc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.01);
            pOsc.connect(padGain);
            pOsc.start(time);
            pOsc.stop(time + duration);
          }
        }
        break;
      case 'opera_vocal':
        duration = (60 / tempo) * 4;
        playOsc = false;
        if (note) {
          const freq = noteToFrequency(note);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1500;
          filter.Q.value = 2;
          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(volume * 0.6, time + 0.8);
          gainNode.gain.linearRampToValueAtTime(0.001, time + duration);
          filter.connect(gainNode).connect(pannerNode);
          for (let i = 0; i < 3; i++) {
            const oOsc = this.ctx.createOscillator();
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
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
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
          pannerNode.connect(this.ctx.destination);
          osc1.start(time);
          osc2.start(time);
          osc1.stop(time + duration);
          osc2.stop(time + duration);
        }
        break;
      case 'guitar_distorted':
        duration = 0.8;
        playOsc = false;
        if (note) {
          const rootFreq = noteToFrequency(note);
          const fifthFreq = rootFreq * 1.5;
          const freqs = [rootFreq, fifthFreq];
          const distortion = this.ctx.createWaveShaper();
          distortion.curve = makeDistortionCurve(200);
          distortion.oversample = '4x';
          const guitarGain = this.ctx.createGain();
          guitarGain.gain.setValueAtTime(volume * 0.5, time);
          guitarGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 3000;
          guitarGain.connect(distortion).connect(filter).connect(pannerNode);
          freqs.forEach(f => {
            const gOsc = this.ctx.createOscillator();
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

  public render(): void {
    const { tracks, sections, arrangement, tempo, swing } = this.storeState;

    const hasSolo = tracks.some(t => t.solo);
    const secondsPerStep = 60.0 / tempo / 4.0;

    let songPosition = 0;
    let currentTime = 0;

    // Calculate total steps
    const totalArrangementSteps = arrangement.reduce((sum, sectionId) => {
      const section = sections[sectionId];
      return sum + (section ? section.bars * STEPS_PER_BAR : 0);
    }, 0);

    // Schedule all notes
    for (let step = 0; step < totalArrangementSteps; step++) {
      // Find which section and local step
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

      if (!currentSectionId) continue;

      const pattern = sections[currentSectionId].pattern;
      const humanizeOffset = (Math.random() - 0.5) * 0.01;
      const scheduledTime = Math.max(currentTime + humanizeOffset, 0);

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

      // Advance time with swing
      if (step % 2 !== 0) {
        currentTime += secondsPerStep * 2 * swing;
      } else {
        currentTime += secondsPerStep * 2 * (1 - swing);
      }
    }
  }
}

export async function exportToWav(
  storeState: StoreState,
  sampleBuffers: Map<string, AudioBuffer>,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { tempo, sections, arrangement } = storeState;

  const totalBars = arrangement.reduce((sum, sectionId) => {
    const section = sections[sectionId];
    return sum + (section ? section.bars : 0);
  }, 0);

  const totalSteps = totalBars * STEPS_PER_BAR;
  const secondsPerStep = 60.0 / tempo / 4;
  const totalDuration = totalSteps * secondsPerStep + 2; // Add 2 seconds for tail

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: Math.ceil(sampleRate * totalDuration),
    sampleRate: sampleRate,
  });

  // Copy sample buffers to offline context
  const offlineSampleBuffers = new Map<string, AudioBuffer>();
  for (const [key, buffer] of sampleBuffers) {
    const newBuffer = offlineCtx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      newBuffer.copyToChannel(buffer.getChannelData(channel), channel);
    }
    offlineSampleBuffers.set(key, newBuffer);
  }

  onProgress?.(10);

  const renderer = new OfflineRenderer(offlineCtx, storeState, offlineSampleBuffers);
  renderer.render();

  onProgress?.(50);

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(80);

  normalizeBuffer(renderedBuffer);

  onProgress?.(90);

  const wavBlob = bufferToWave(renderedBuffer);

  onProgress?.(100);

  return wavBlob;
}

function bufferToWave(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);

  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
