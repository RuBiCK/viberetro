'use client';

import React from 'react';
import { useSession } from '../../context/SessionContext';
import { TEMPLATES } from '../../types';
import ShareModal from '../ShareModal';

export default function SetupStage() {
  const { session, users, isHost, advanceStage } = useSession();
  const [showShareModal, setShowShareModal] = React.useState(false);

  if (!session) return null;

  const template = TEMPLATES[session.settings.template];

  return (
    <div className="relative min-h-[600px]">
      {/* Center - Waiting Room */}
      <div className="flex flex-col items-center justify-center min-h-[600px] pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Waiting Room
          </h2>
          <p className="text-gray-600">
            {isHost
              ? 'Start when everyone has joined'
              : 'Waiting for host to start the retrospective...'}
          </p>
        </div>

        {/* Users Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
          <div className="mb-6">
            <div className="text-lg font-semibold text-gray-900">
              Participants ({users.length})
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {users.map(user => (
              <div
                key={user.id}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2"
                  style={{ backgroundColor: user.color }}
                >
                  {user.displayName[0].toUpperCase()}
                </div>
                <div className="text-sm font-medium text-gray-900 text-center">
                  {user.displayName}
                </div>
                {user.isHost && (
                  <div className="mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Host
                  </div>
                )}
              </div>
            ))}
          </div>

          {isHost && (
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={advanceStage}
                className="flex-1 bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
              >
                Start Retrospective
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors"
                title="Share Session Link"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Session Setup Summary - Below Participants */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 border-2 border-indigo-200">
          <h3 className="text-base font-bold text-gray-900 mb-4">📋 Session Setup</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 font-medium mb-1">Template</div>
              <div className="text-gray-900 font-semibold">{template.name}</div>
            </div>

            <div>
              <div className="text-gray-600 font-medium mb-1">Columns</div>
              <div className="flex flex-wrap gap-1">
                {template.columns.map(col => (
                  <span
                    key={col}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-600 font-medium mb-1">Timer Duration</div>
              <div className="text-gray-900 font-semibold">
                {Math.floor(session.settings.timerDuration / 60)} minutes per stage
              </div>
            </div>

            <div>
              <div className="text-gray-600 font-medium mb-1">Votes Per User</div>
              <div className="text-gray-900 font-semibold">
                {session.settings.votesPerUser} votes
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-gray-600 font-medium mb-1">Ice Breaker Question</div>
              <div className="text-gray-900 italic">
                "{session.settings.iceBreaker}"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        sessionId={session.id}
      />
    </div>
  );
}
