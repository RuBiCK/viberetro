'use client';

import Board from '../Board/Board';

export default function GroupStage() {
  return (
    <div>
      <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Group 🎯
        </h2>
        <p className="text-gray-700 mb-2">
          All cards are now revealed! <strong>Drag cards onto each other</strong> to create clusters of similar themes.
        </p>
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span>Drag cards together to cluster</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Click X to ungroup</span>
          </div>
        </div>
      </div>

      <Board canDrag={true} canAddCards={false} />
    </div>
  );
}
