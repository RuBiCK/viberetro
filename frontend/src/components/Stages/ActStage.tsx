'use client';

import { useState } from 'react';
import { useSession } from '../../context/SessionContext';

export default function ActStage() {
  const { actionItems, createActionItem, deleteActionItem, users } = useSession();
  const [owner, setOwner] = useState('');
  const [task, setTask] = useState('');

  const handleCreate = () => {
    if (owner.trim() && task.trim()) {
      createActionItem(owner.trim(), task.trim());
      setOwner('');
      setTask('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Act ✅
        </h2>
        <p className="text-gray-700">
          Create concrete action items based on the discussion. Assign an owner to each task.
        </p>
      </div>

      {/* Create Action Item Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Action Item
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Who will do this?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              list="users-list"
            />
            <datalist id="users-list">
              {users.map(user => (
                <option key={user.id} value={user.displayName} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleCreate}
                disabled={!owner.trim() || !task.trim()}
                className="bg-secondary hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Action Items ({actionItems.length})
        </h3>

        {actionItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No action items yet. Add your first one above!
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {item.owner}
                    </span>
                  </div>
                  <p className="text-gray-900">{item.task}</p>
                </div>

                <button
                  onClick={() => deleteActionItem(item.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
