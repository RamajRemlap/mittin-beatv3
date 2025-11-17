import React, { useState } from 'react';

const StyleInfo = ({ title, tempo, characteristics }: { title: string, tempo: string, characteristics: string[] }) => (
  <div>
    <h4 className="font-bold text-cyan-400">{title}</h4>
    <p className="text-sm text-gray-400 mb-2">Tempo: {tempo}</p>
    <ul className="list-disc list-inside text-sm space-y-1 text-gray-300">
      {characteristics.map((char, i) => <li key={i}>{char}</li>)}
    </ul>
  </div>
);

export default function HelpSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
        <h2 className="text-lg font-bold text-gray-300">Learn The Style</h2>
        <p className="text-xs text-gray-400">Click to expand</p>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <StyleInfo 
            title="Detroit Style"
            tempo="170-200+ BPM"
            characteristics={[
              "Built on minor-key chord progressions.",
              "Aggressive, syncopated kick drums.",
              "Dense hi-hats with frequent 32nd-note rolls.",
              "Hard-hitting claps on the 2 & 4.",
              "Punchy, repetitive melodies and 808s that follow the kicks."
            ]}
          />
          <StyleInfo 
            title="Flint Style"
            tempo="150-170 BPM"
            characteristics={[
              "Bouncier, more conversational groove.",
              "Sparse kick patterns that leave space for vocals.",
              "Features 'walking' 808 basslines using chord tones.",
              "Signature bell melodies that 'talk' back to the drums.",
              "Snare/clap on 2 & 4, often with ghost notes for extra bounce."
            ]}
          />
           <StyleInfo 
            title="Cinematic Style"
            tempo="120-140 BPM"
            characteristics={[
              "Dramatic and tense, built on classic minor progressions.",
              "Solid kick/snare backbeat provides a foundation.",
              "Bassline follows the root note of each chord.",
              "Features arpeggiated melodies using chord tones to build suspense.",
              "Ideal for storytelling and creating a dark, evocative mood."
            ]}
          />
        </div>
      )}
    </div>
  );
}