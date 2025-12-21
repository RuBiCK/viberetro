'use client';

import { useState } from 'react';
import { useSession } from '../../context/SessionContext';

export default function ActStage() {
  const {
    session,
    actionItems,
    createActionItem,
    updateActionItem,
    deleteActionItem,
    users,
    cards,
    clusters,
    getTargetVotes,
    isHost
  } = useSession();
  const [ownerType, setOwnerType] = useState<'participant' | 'manual'>('participant');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [manualOwner, setManualOwner] = useState('');
  const [selectedThought, setSelectedThought] = useState('');
  const [manualTask, setManualTask] = useState('');

  // Get all votable items with their vote counts
  const votableItems = [
    ...cards.map(card => ({
      id: card.id,
      type: 'card' as const,
      content: card.content,
      votes: getTargetVotes(card.id).length
    })),
    ...clusters.map(cluster => ({
      id: cluster.id,
      type: 'cluster' as const,
      content: cluster.name,
      votes: getTargetVotes(cluster.id).length
    }))
  ]
    .filter(item => getTargetVotes(item.id).length > 0)
    .sort((a, b) => b.votes - a.votes); // Sort by votes descending

  const handleCreate = () => {
    const owner = ownerType === 'participant' ? selectedParticipant : manualOwner.trim();

    if (owner && manualTask.trim()) {
      const fullTask = selectedThought
        ? `[${selectedThought}] ${manualTask.trim()}`
        : manualTask.trim();
      createActionItem(owner, fullTask);
      setSelectedParticipant('');
      setManualOwner('');
      setSelectedThought('');
      setManualTask('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Act ✅
        </h2>
        <p className="text-sm text-gray-700">
          Create concrete action items based on the discussion. Assign an owner to each task.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Action Item</h3>

        <div className="space-y-3">
          {/* Owner Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Owner *
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setOwnerType('participant')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  ownerType === 'participant'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Select Participant
              </button>
              <button
                type="button"
                onClick={() => setOwnerType('manual')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  ownerType === 'manual'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Enter Manually
              </button>
            </div>

            {ownerType === 'participant' ? (
              <select
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Select a participant...</option>
                {users.map(user => (
                  <option key={user.id} value={user.displayName}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={manualOwner}
                onChange={(e) => setManualOwner(e.target.value)}
                placeholder="Enter owner name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            )}
          </div>

          {/* Optional: Select from voted items */}
          {votableItems.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference a voted item (optional)
              </label>
              <select
                value={selectedThought}
                onChange={(e) => setSelectedThought(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">None</option>
                {votableItems.map(item => (
                  <option key={item.id} value={item.content}>
                    {item.content} ({item.votes} votes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Action Item *
            </label>
            <textarea
              value={manualTask}
              onChange={(e) => setManualTask(e.target.value)}
              placeholder="What needs to be done?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={
              (ownerType === 'participant' ? !selectedParticipant : !manualOwner.trim()) ||
              !manualTask.trim()
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Add Action Item
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Action Items ({actionItems.length})
        </h3>

        {actionItems.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            No action items yet. Add your first one above!
          </div>
        ) : (
          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {item.owner}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {item.task}
                  </p>
                </div>

                <button
                  onClick={() => deleteActionItem(item.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-orange-600 transition-colors mt-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
