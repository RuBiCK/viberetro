'use client';

import { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

export default function IceBreakerStage() {
  const { iceBreakers, createIceBreaker, revealIceBreakers, users, currentUser, session, isHost } = useSession();
  const [input, setInput] = useState('');
  const [animateNumbers, setAnimateNumbers] = useState(false);

  const userHasShared = iceBreakers.some(ib => ib.userId === currentUser?.id);

  // Count unique users who shared
  const usersWhoShared = new Set(iceBreakers.map(ib => ib.userId)).size;
  const totalUsers = users.length;
  const allUsersShared = usersWhoShared === totalUsers && totalUsers > 0;

  // Animate numbers when all users have shared
  useEffect(() => {
    if (allUsersShared && !animateNumbers) {
      setAnimateNumbers(true);
      setTimeout(() => setAnimateNumbers(false), 2000);
    }
  }, [allUsersShared, animateNumbers]);

  const handleSubmit = () => {
    if (input.trim() && !userHasShared) {
      createIceBreaker(input.trim(), 'text');
      setInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Ice Breaker 🎉
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-600">Participation</div>
            <div className={`text-2xl font-bold transition-all duration-300 ${
              animateNumbers
                ? 'text-green-500 scale-150 animate-pulse'
                : 'text-primary scale-100'
            }`}>
              {usersWhoShared} / {totalUsers}
            </div>
          </div>
        </div>

        {session && (
          <p className="text-gray-600 mb-4 italic">
            "{session.settings.iceBreaker}"
          </p>
        )}
        <div className="flex gap-2 items-start">
          {userHasShared ? (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ You've already shared! Thank you for participating.
              </p>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Share something fun..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="bg-primary hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </>
          )}
          {isHost && !session?.iceBreakersRevealed && (
            <button
              onClick={revealIceBreakers}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Reveal All
            </button>
          )}
        </div>
      </div>

      {/* Ice Breaker Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {iceBreakers.map(iceBreaker => {
          const user = users.find(u => u.id === iceBreaker.userId);
          const isOwnIceBreaker = iceBreaker.userId === currentUser?.id;
          const shouldBlur = !session?.iceBreakersRevealed && !isOwnIceBreaker;

          return (
            <div
              key={iceBreaker.id}
              className="bg-white rounded-lg shadow p-4 border-l-4"
              style={{ borderLeftColor: user?.color || '#999' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: user?.color || '#999' }}
                >
                  {user?.displayName[0].toUpperCase() || '?'}
                </div>
                <span className={`font-medium ${shouldBlur ? 'blur-sm' : 'text-gray-900'}`}>
                  {user?.displayName || 'Unknown'}
                </span>
              </div>
              <p className={`text-lg ${shouldBlur ? 'blur-md text-gray-400' : 'text-gray-700'}`}>
                {iceBreaker.content}
              </p>
            </div>
          );
        })}
      </div>

      {iceBreakers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No one has shared yet. Be the first! 🎉
        </div>
      )}
    </div>
  );
}
