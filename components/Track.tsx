import React from 'react';
import { useStore } from '../store/useStore';
import { Track as TrackType, Step } from '../types';
import { STEPS_PER_BAR } from '../constants';

interface TrackProps {
  track: TrackType;
  trackIndex: number;
  pattern: Step[];
}

interface StepButtonProps {
    stepIndex: number;
    trackIndex: number;
    isActive: boolean;
    isBeat: boolean;
}

const StepButton = React.memo(({ stepIndex, trackIndex, isActive, isBeat }: StepButtonProps) => {
    const toggleStep = useStore(state => state.toggleStep);
    
    const baseClasses = "w-8 h-12 rounded transition-colors border-2";
    const activeClasses = isActive ? 'bg-cyan-500 border-cyan-400' : 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/50';
    const beatClasses = isBeat ? 'border-gray-500/80' : 'border-transparent';

    return (
        <button
            onClick={() => toggleStep(trackIndex, stepIndex)}
            className={`${baseClasses} ${activeClasses} ${isBeat ? beatClasses : ''}`}
            aria-label={`Step ${stepIndex + 1}`}
            data-step-index={stepIndex}
        />
    );
});


const Track: React.FC<TrackProps> = ({ track, trackIndex, pattern }) => {
  const totalSteps = pattern.length;
  
  return (
      <div className="flex items-center gap-4">
        <div className="w-32 flex-shrink-0 text-sm font-medium text-gray-300 truncate pr-2 text-right">{track.name}</div>
        <div className="flex-grow grid gap-1" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}>
          {pattern.map((step, stepIndex) => (
            <StepButton
              key={stepIndex}
              stepIndex={stepIndex}
              trackIndex={trackIndex}
              isActive={step.isActive}
              isBeat={stepIndex % 4 === 0}
            />
          ))}
        </div>
      </div>
  );
}

export default Track;