'use client';

import Board from '../Board/Board';

export default function ReflectStage() {
  return (
    <div>
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Reflect 🤔
        </h2>
        <p className="text-gray-700">
          Write your cards privately. They are <strong>blurred to others</strong> to avoid bias.
          Be honest and constructive!
        </p>
      </div>

      <Board showBlurred={true} />
    </div>
  );
}
