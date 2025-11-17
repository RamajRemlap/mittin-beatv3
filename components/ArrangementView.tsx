import React from 'react';
import { useStore } from '../store/useStore';
import { TrashIcon } from './Icons';

export default function ArrangementView() {
  const arrangement = useStore(state => state.arrangement);
  const sections = useStore(state => state.sections);
  const activeSectionId = useStore(state => state.activeSectionId);
  const currentStep = useStore(state => state.currentStep);
  
  const setActiveSectionId = useStore(state => state.setActiveSectionId);
  const duplicateSection = useStore(state => state.duplicateSection);
  const deleteSection = useStore(state => state.deleteSection);
  const addSection = useStore(state => state.addSection);

  let stepsIntoArrangement = 0;
  let playingSectionIndex = -1;

  if (currentStep >= 0) {
    for (let i = 0; i < arrangement.length; i++) {
        const sectionId = arrangement[i];
        const section = sections[sectionId];
        if (!section) continue;

        const sectionSteps = section.bars * 16;
        if (currentStep >= stepsIntoArrangement && currentStep < stepsIntoArrangement + sectionSteps) {
            playingSectionIndex = i;
            break;
        }
        stepsIntoArrangement += sectionSteps;
    }
  }


  return (
    <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg">
      <h3 className="text-md font-bold mb-2 text-gray-300">Arrangement</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {arrangement.map((sectionId, index) => {
          const section = sections[sectionId];
          if (!section) return null;
          const isEditing = sectionId === activeSectionId;
          const isPlaying = index === playingSectionIndex;
          
          let baseClasses = 'px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 group ';
          let colorClasses = '';
          if (isEditing) {
            colorClasses = 'bg-cyan-500 text-white ring-2 ring-cyan-300 ring-offset-2 ring-offset-gray-800 ';
          } else if (isPlaying) {
             colorClasses = 'bg-purple-500 text-white ';
          }
          else {
            colorClasses = 'bg-gray-700 hover:bg-gray-600 ';
          }

          return (
            <div key={`${sectionId}-${index}`} className="relative">
              <button
                onClick={() => setActiveSectionId(sectionId)}
                onDoubleClick={() => duplicateSection(sectionId)}
                className={baseClasses + colorClasses}
              >
                <span>{section.name}</span>
              </button>
               {isEditing && arrangement.length > 1 && (
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(sectionId);
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete ${section.name}`}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
               )}
            </div>
          );
        })}
        <button 
            onClick={() => addSection('New', 4)} 
            className="px-2 py-1 rounded text-sm bg-gray-600 hover:bg-purple-500"
            title="Add new section"
        >
            +
        </button>
      </div>
    </div>
  );
}