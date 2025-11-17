import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import Track from './Track';
import { STEPS_PER_BAR } from '../constants';

const Ruler = ({ bars }: { bars: number }) => {
  const totalSteps = bars * STEPS_PER_BAR;
  return (
    <div className="sticky top-0 bg-gray-900 z-10 flex h-6 items-end" style={{ minWidth: `${totalSteps * 2.25}rem`}}>
      <div className="w-36 flex-shrink-0"></div> {/* Spacer for track names */}
      <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${bars}, 1fr)` }}>
        {Array.from({ length: bars }).map((_, barIndex) => (
          <div key={barIndex} className="text-xs text-gray-500 border-l border-gray-600 pl-1">
            {barIndex + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Sequencer() {
  const tracks = useStore(state => state.tracks);
  const sections = useStore(state => state.sections);
  const activeSectionId = useStore(state => state.activeSectionId);
  const sequencerContainerRef = useRef<HTMLDivElement>(null);
  
  const activeSection = activeSectionId ? sections[activeSectionId] : null;

  useEffect(() => {
    const container = sequencerContainerRef.current;
    if (!container) return;

    const getStepColumn = (stepIndex: number): NodeListOf<HTMLButtonElement> => {
        return container.querySelectorAll(`button[data-step-index="${stepIndex}"]`);
    };

    const highlightClassNames = ['ring-2', 'ring-offset-2', 'ring-offset-gray-800', 'ring-white'];

    const subscription = useStore.subscribe(
      (state) => state.currentStep,
      (currentStep, previousStep) => {
        // De-highlight previous column
        if (previousStep >= 0) {
            getStepColumn(previousStep).forEach(el => el.classList.remove(...highlightClassNames));
        }
        // Highlight current column
        if (currentStep >= 0) {
            getStepColumn(currentStep).forEach(el => el.classList.add(...highlightClassNames));
        }
      }
    );
    
    // Cleanup on unmount or when section changes
    return () => {
        subscription();
        // Clean up any lingering highlights
        const currentStep = useStore.getState().currentStep;
        if (currentStep >= 0) {
             getStepColumn(currentStep).forEach(el => el.classList.remove(...highlightClassNames));
        }
    };
  }, [activeSectionId]); // Rerun effect if the DOM structure changes

  if (!activeSection) {
    return (
      <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg flex items-center justify-center h-full">
          <div className="text-center text-gray-400 italic">
              No active section. Please select a section to view the pattern.
          </div>
      </div>
    );
  }

  const { pattern, bars } = activeSection;
  const totalSteps = bars * STEPS_PER_BAR;

  return (
    <div ref={sequencerContainerRef} className="bg-gray-800/50 p-2 sm:p-4 rounded-lg overflow-auto relative">
        <div className="text-center mb-4 text-gray-400 italic">
          “Ready to build a real Flint/Detroit banger? Click GENERATE. Then, ride the pocket.”
        </div>
        <Ruler bars={bars} />
        <div className="space-y-1 mt-1" style={{ minWidth: `${totalSteps * 2.25}rem`}}>
            {tracks.map((track, trackIndex) => (
                <Track
                key={track.id}
                track={track}
                trackIndex={trackIndex}
                pattern={pattern[trackIndex]}
                />
            ))}
        </div>
    </div>
  );
}