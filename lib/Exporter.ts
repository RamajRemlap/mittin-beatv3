
// lib/Exporter.ts
import { StoreState } from '../types';
import { STEPS_PER_BAR } from '../constants';

// This is a simplified placeholder. A real implementation would be more complex.
// It requires rendering the sequence using OfflineAudioContext and then encoding to WAV.


/**
 * Normalizes an AudioBuffer to a target peak level.
 * This prevents clipping while maximizing volume.
 * @param buffer The AudioBuffer to normalize.
 * @param targetDb The target peak level in decibels. Defaults to -0.1dB.
 */
function normalizeBuffer(buffer: AudioBuffer, targetDb = -0.1) {
    const targetGain = Math.pow(10, targetDb / 20);
    let maxGain = 0;

    // Find the absolute peak value across all channels
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        const channelData = buffer.getChannelData(i);
        for (let j = 0; j < channelData.length; j++) {
            maxGain = Math.max(maxGain, Math.abs(channelData[j]));
        }
    }

    if (maxGain === 0) return; // It's a silent buffer

    const gainCorrection = targetGain / maxGain;

    // Apply the gain correction to all channels
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        const channelData = buffer.getChannelData(i);
        for (let j = 0; j < channelData.length; j++) {
            channelData[j] *= gainCorrection;
        }
    }
}


export async function exportToWav(storeState: StoreState): Promise<Blob> {
  // A real implementation would show progress and a "bounce meter" UI.
  // This placeholder generates a normalized, silent WAV file.
  alert('Exporting... The generated WAV will be normalized for maximum punch. (Demo is silent)');
  
  // FIX: Use `sections` and `arrangement` to calculate total duration, as top-level `patterns`, `activePattern`, and `bars` are obsolete.
  const { tempo, sections, arrangement } = storeState;
  
  const totalBars = arrangement.reduce((sum, sectionId) => {
      const section = sections[sectionId];
      return sum + (section ? section.bars : 0);
  }, 0);

  const totalSteps = totalBars * STEPS_PER_BAR;
  const secondsPerStep = 60.0 / tempo / 4;
  const totalDuration = totalSteps * secondsPerStep;
  
  // NOTE: OfflineAudioContext must be used for non-realtime rendering
  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 44100 * totalDuration,
    sampleRate: 44100,
  });

  // A full implementation would need to recreate the AudioEngine's logic here,
  // scheduling all notes into the OfflineAudioContext.
  // This is a complex task beyond a simple generator script.
  console.log('Simulating offline render for', totalDuration, 'seconds...');

  const renderedBuffer = await offlineCtx.startRendering();
  
  // NORMALIZE: Ensure the final output has a consistent, loud volume without clipping.
  normalizeBuffer(renderedBuffer);

  // Convert AudioBuffer to WAV
  const wavBlob = bufferToWave(renderedBuffer);
  return wavBlob;
}


// Function to convert AudioBuffer to a WAV file (Blob)
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
  
    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
  
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
  
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
  
    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
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
