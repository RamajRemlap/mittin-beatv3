// This file contains placeholder audio samples encoded as base64 strings
// and the logic to load them into the application.

// A real app would fetch these from a server. For this self-contained demo,
// we generate tiny, synthesized WAV files on the fly to represent the samples.

import { INSTRUMENTS } from '../constants';

// --- RIFF WAVE File Generation ---
// A tiny utility to create a valid, playable WAV file in memory.
function createWavFile(audioData: Float32Array, sampleRate: number): string {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit audio
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format 1 = PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// --- Placeholder Sample Generation ---
function generateKick(sampleRate: number): string {
    const duration = 0.25;
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Harder hitting kick with lower fundamental and punch
        const freq = 55 * Math.exp(-t * 18); // Lower starting freq for sub bass
        const amp = Math.exp(-t * 12);
        const click = Math.exp(-t * 180) * 0.4; // Transient click
        // Add harmonic for punch
        const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.2 * amp;
        const fundamental = Math.sin(2 * Math.PI * freq * t) * amp;
        // Soft clipping for saturation
        let sample = fundamental + harmonic + click;
        sample = Math.tanh(sample * 2.5) * 0.95;
        data[i] = sample;
    }
    return createWavFile(data, sampleRate);
}

function generateSnare(sampleRate: number): string {
    const duration = 0.22;
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const amp = Math.exp(-t * 12);
        // White noise for snare body
        const noise = (Math.random() * 2 - 1) * amp;
        // Tonal component for 909-style snap
        const tone1 = Math.sin(2 * Math.PI * 180 * t) * amp * 0.6;
        const tone2 = Math.sin(2 * Math.PI * 330 * t) * amp * 0.4;
        // Transient snap
        const snap = Math.exp(-t * 200) * 0.7;
        let sample = noise + tone1 + tone2 + snap;
        // Saturation for character
        sample = Math.tanh(sample * 2.2) * 0.9;
        data[i] = sample;
    }
    return createWavFile(data, sampleRate);
}

function generateHat(sampleRate: number): string {
    const duration = 0.08;
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const amp = Math.exp(-t * 45);
        // Metallic harmonics for 909-style hat
        let sample = 0;
        const freqs = [187, 223, 296, 364, 587, 693];
        for (const freq of freqs) {
            sample += Math.sin(2 * Math.PI * freq * t) * (Math.random() * 0.3 + 0.7);
        }
        sample = sample / freqs.length;
        // Add noise for texture
        sample += (Math.random() * 2 - 1) * 0.4;
        sample = sample * amp;
        data[i] = sample * 0.7;
    }
    // High-pass filter
    for (let i = 1; i < length; i++) {
       data[i] = 0.85 * (data[i] - data[i-1]);
    }
    return createWavFile(data, sampleRate);
}

function generate808(sampleRate: number): string {
    const duration = 2.0;
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    const freq = 55; // Deep A1 for harder hitting sub bass
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const amp = Math.exp(-t * 1.8);
        // Layered sine waves for thick 808
        const sub = Math.sin(2 * Math.PI * freq * t) * amp;
        const harmonic2 = Math.sin(2 * Math.PI * freq * 2 * t) * amp * 0.3;
        const harmonic3 = Math.sin(2 * Math.PI * freq * 3 * t) * amp * 0.15;
        // Pitch bend for classic 808 slide
        const pitchEnv = 1 + Math.exp(-t * 25) * 0.5;
        const bendedFreq = freq * pitchEnv;
        const mainOsc = Math.sin(2 * Math.PI * bendedFreq * t) * amp;
        let sample = mainOsc + harmonic2 + harmonic3;
        // Saturation for warmth and punch
        sample = Math.tanh(sample * 2.8) * 1.1;
        data[i] = sample;
    }
    return createWavFile(data, sampleRate);
}

function generateVocal(sampleRate: number, freq: number): string {
    const duration = 2.0;
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const amp = Math.exp(-t * 0.5) * (1 - Math.exp(-t * 5));
        const v1 = Math.sin(2 * Math.PI * freq * t);
        const v2 = Math.sin(2 * Math.PI * freq * 2 * t);
        const v3 = Math.sin(2 * Math.PI * freq * 3 * t);
        data[i] = (v1 * 0.6 + v2 * 0.3 + v3 * 0.1) * amp;
    }
    return createWavFile(data, sampleRate);
}

// Map instrument IDs to their placeholder sample data
export const SAMPLES: Record<string, string> = {
    [INSTRUMENTS.KICK_TRAP.id]: generateKick(44100),
    [INSTRUMENTS.SNARE_TRAP.id]: generateSnare(44100),
    [INSTRUMENTS.HAT_TRAP.id]: generateHat(44100),
    [INSTRUMENTS.BASS_808_SAMPLED.id]: generate808(44100),
    [INSTRUMENTS.CHOIR_SAMPLED.id]: generateVocal(44100, 220), // A3
    [INSTRUMENTS.OPERA_SAMPLED.id]: generateVocal(44100, 440), // A4
};

// --- Sample Loading Function ---
export async function loadSamples(audioContext: AudioContext): Promise<Map<string, AudioBuffer>> {
    const sampleMap = new Map<string, AudioBuffer>();
    const promises = Object.entries(SAMPLES).map(async ([id, base64Data]) => {
        try {
            const response = await fetch(`data:audio/wav;base64,${base64Data}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            sampleMap.set(id, audioBuffer);
        } catch (error) {
            console.error(`Failed to load sample for ${id}:`, error);
        }
    });

    await Promise.all(promises);
    return sampleMap;
}