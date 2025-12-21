'use client';

import '../../../lib/polyfills';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '../../../context/SessionContext';
import SetupStage from '../../../components/Stages/SetupStage';
import IceBreakerStage from '../../../components/Stages/IceBreakerStage';
import ReflectStage from '../../../components/Stages/ReflectStage';
import GroupStage from '../../../components/Stages/GroupStage';
import VoteStage from '../../../components/Stages/VoteStage';
import ActStage from '../../../components/Stages/ActStage';
import Timer from '../../../components/Timer';
import StagePipeline from '../../../components/StagePipeline';
import Cursor from '../../../components/Cursor';
import ConnectionStatus from '../../../components/ConnectionStatus';
import { SessionStage } from '../../../types';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session, joinSession, connected, users, currentUser, isHost, advanceStage, previousStage, exportSession, leftUsers, moveCursor, reconnectAttempts, isReconnecting } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // Check if we have an existing user ID for this session (for reconnection)
    const userId = localStorage.getItem(`user_${sessionId}`);
    if (userId) {
      // We have a stored user ID, automatically rejoin
      const storedName = localStorage.getItem(`user_name_${sessionId}`) || 'User';
      setDisplayName(storedName);
      joinSession(sessionId, storedName);
      setJoined(true);
    }
  }, [sessionId, joinSession]);

  // Mouse tracking with throttling
  useEffect(() => {
    if (!session || !connected) return;

    // Enable cursors during collaborative stages and waiting stages
    const showCursors = session.stage === SessionStage.SETUP ||
      session.stage === SessionStage.ICE_BREAKER ||
      session.stage === SessionStage.VOTE ||
      session.stage === SessionStage.ACT;

    if (!showCursors) return;

    let lastEmitTime = 0;
    const THROTTLE_MS = 300;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastEmitTime > THROTTLE_MS) {
        moveCursor(e.clientX, e.clientY);
        lastEmitTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [session, connected, moveCursor]);

  const handleJoin = () => {
    if (displayName.trim()) {
      // Store display name for reconnection
      localStorage.setItem(`user_name_${sessionId}`, displayName);

      // Check if user is host
      const hostId = localStorage.getItem(`host_${sessionId}`);
      if (hostId) {
        // Store hostId to pass to backend
        localStorage.setItem('currentHostId', hostId);
      }

      joinSession(sessionId, displayName);
      setJoined(true);
    }
  };

  if (!joined) {
    const hostId = localStorage.getItem(`host_${sessionId}`);
    const isHostJoining = !!hostId;

    return (
      <div className="min-h-screen spotify-gradient flex items-center justify-center p-4">
        <div className="max-w-md w-full spotify-card shadow-2xl p-8 border border-gray-200">
          {isHostJoining && (
            <div className="mb-4 px-3 py-2 bg-purple-50 border border-purple-300 rounded-lg">
              <p className="text-purple-700 text-sm font-medium text-center">
                👑 You are the host of this session
              </p>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session ? session.name : 'Join Retrospective'}
          </h1>
          <p className="text-gray-600 mb-6">
            Enter your display name to join the session
          </p>

          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Your Name"
            className="w-full px-4 py-3 mb-4"
            autoFocus
          />

          <button
            onClick={handleJoin}
            disabled={!displayName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-green)' }}
          >
            Join Session
          </button>
        </div>
      </div>
    );
  }

  if (!session || !connected) {
    return (
      <div className="min-h-screen spotify-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-green)' }}></div>
          <p className="text-gray-600">Connecting...</p>
        </div>
      </div>
    );
  }

  // Determine if cursors should be shown
  const showCursors = session?.stage === SessionStage.SETUP ||
    session?.stage === SessionStage.ICE_BREAKER ||
    session?.stage === SessionStage.GROUP ||
    session?.stage === SessionStage.VOTE ||
    session?.stage === SessionStage.ACT;

  // Other users (excluding current user)
  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <div className="min-h-screen spotify-gradient">
      {/* Reconnection Notification */}
      {isReconnecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="spotify-card border border-yellow-300 px-6 py-3 shadow-lg animate-pulse bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-700"></div>
              <p className="text-yellow-700 font-medium">
                Reconnecting... (Attempt {reconnectAttempts})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Left Users Notification (Host Only) */}
      {isHost && leftUsers.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {leftUsers.map((userName, index) => (
            <div
              key={index}
              className="spotify-card border border-orange-300 px-4 py-3 shadow-lg animate-slide-in bg-orange-50"
            >
              <p className="text-orange-700 font-medium">
                👋 {userName} left the session
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Spotify-style Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="max-w-full mx-auto">
          {/* Top row - Badge and Session Title */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <ConnectionStatus connected={connected} />
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 mt-2">
                {session.name}
              </h1>
              <p className="text-xs text-gray-600">
                {session.stage.replace('_', ' ').charAt(0).toUpperCase() + session.stage.replace('_', ' ').slice(1).toLowerCase()} • {users.length} participant{users.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Participants Avatars */}
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {users.slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow-sm"
                    style={{
                      backgroundColor: user.color,
                      borderColor: '#ffffff'
                    }}
                    title={user.displayName}
                  >
                    {user.displayName[0].toUpperCase()}
                  </div>
                ))}
              </div>
              {users.length > 5 && (
                <span className="text-xs text-gray-600 ml-1">
                  +{users.length - 5}
                </span>
              )}
            </div>
          </div>

          {/* Spotify-style Control Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Timer */}
            <div className="flex-1 flex justify-start">
              <Timer />
            </div>

            {/* Right side - Actions and Navigation */}
            <div className="flex items-center gap-2">
              {/* Export Button */}
              {(isHost || session.stage === SessionStage.COMPLETE) && (
                <button
                  onClick={exportSession}
                  className="px-4 py-1.5 rounded-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-xs shadow-sm"
                >
                  Export
                </button>
              )}

              {/* Host Navigation Controls */}
              {isHost && (
                <>
                  {/* Previous Stage Button */}
                  {session.stage !== SessionStage.SETUP && (
                    <button
                      onClick={previousStage}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-all shadow-sm"
                      title="Previous stage"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                      </svg>
                    </button>
                  )}

                  {/* Next Stage Button */}
                  {session.stage !== SessionStage.COMPLETE && (
                    <button
                      onClick={advanceStage}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-105"
                      style={{ backgroundColor: 'var(--accent-green)' }}
                      title="Next stage"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stage Pipeline */}
      <StagePipeline currentStage={session.stage} />

      {/* Stage Content */}
      <main className="p-3">
        {session.stage === SessionStage.SETUP && <SetupStage />}
        {session.stage === SessionStage.ICE_BREAKER && <IceBreakerStage />}
        {session.stage === SessionStage.REFLECT && <ReflectStage />}
        {session.stage === SessionStage.GROUP && <GroupStage />}
        {session.stage === SessionStage.VOTE && <VoteStage />}
        {session.stage === SessionStage.ACT && <ActStage />}
        {session.stage === SessionStage.COMPLETE && (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto spotify-card p-12 border border-gray-200">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl font-black text-gray-900 mb-4">
                Retrospective Complete!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Thank you for participating. You can export the results using the Export button.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Other users' cursors */}
      {showCursors && otherUsers.map(user => (
        <Cursor key={user.id} user={user} />
      ))}
    </div>
  );
}
