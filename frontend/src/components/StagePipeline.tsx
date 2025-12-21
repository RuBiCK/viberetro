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
    <div className="px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center justify-center max-w-full mx-auto">
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
                    relative transition-all duration-300
                    ${isActive ? 'scale-125' : 'scale-100'}
                  `}
                >
                  {/* Background glow for active stage */}
                  {isActive && (
                    <div
                      className="absolute inset-0 blur-xl opacity-30"
                      style={{ backgroundColor: 'var(--accent-green)' }}
                    />
                  )}

                  <div
                    className={`
                      relative w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all shadow-sm
                      ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg' : ''}
                      ${isCompleted ? 'bg-green-100' : ''}
                      ${isPending ? 'bg-gray-100' : ''}
                    `}
                  >
                    {stage.icon}
                  </div>
                </div>
                <div
                  className={`
                    mt-1.5 text-[10px] font-semibold transition-all whitespace-nowrap
                    ${isActive ? 'text-gray-900 scale-105' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${isPending ? 'text-gray-400' : ''}
                  `}
                >
                  {stage.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className="relative h-0.5 flex-1 mx-1 rounded-full overflow-hidden"
                  style={{ marginTop: '-30px' }}
                >
                  <div className="absolute inset-0 bg-gray-200" />
                  <div
                    className={`
                      absolute inset-0 transition-all duration-500
                      ${index < currentIndex ? 'w-full' : 'w-0'}
                    `}
                    style={{
                      background: 'linear-gradient(90deg, var(--accent-green) 0%, var(--accent-purple) 100%)'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
