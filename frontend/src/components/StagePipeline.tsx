'use client';

import { SessionStage } from '../types';

interface StagePipelineProps {
  currentStage: SessionStage;
}

const stages = [
  { key: SessionStage.ICE_BREAKER, label: 'Ice Breaker', icon: '🧊' },
  { key: SessionStage.REFLECT, label: 'Add Cards', icon: '📝' },
  { key: SessionStage.GROUP, label: 'Cluster', icon: '📦' },
  { key: SessionStage.VOTE, label: 'Vote', icon: '🗳️' },
  { key: SessionStage.ACT, label: 'Actions', icon: '✅' },
  { key: SessionStage.COMPLETE, label: 'Complete', icon: '🎉' }
];

export default function StagePipeline({ currentStage }: StagePipelineProps) {
  const currentIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-center max-w-4xl mx-auto">
        {stages.map((stage, index) => {
          const isActive = stage.key === currentStage;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    text-3xl transition-all
                    ${isActive ? 'scale-125' : ''}
                    ${isCompleted ? 'opacity-100' : ''}
                    ${isPending ? 'opacity-40' : ''}
                  `}
                >
                  {stage.icon}
                </div>
                <div
                  className={`
                    mt-2 text-xs font-medium transition-colors
                    ${isActive ? 'text-primary font-bold' : ''}
                    ${isCompleted ? 'text-secondary' : ''}
                    ${isPending ? 'text-gray-400' : ''}
                  `}
                >
                  {stage.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-2 transition-colors rounded
                    ${index < currentIndex ? 'bg-secondary' : 'bg-gray-200'}
                  `}
                  style={{ marginTop: '-32px' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
