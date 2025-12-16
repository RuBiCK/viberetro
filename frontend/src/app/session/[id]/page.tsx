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
import { SessionStage } from '../../../types';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session, joinSession, connected, users, currentUser, isHost, advanceStage, previousStage, exportSession, leftUsers, moveCursor } = useSession();
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
                       session.stage === SessionStage.GROUP ||
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          {isHostJoining && (
            <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium text-center">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary mb-4"
            autoFocus
          />

          <button
            onClick={handleJoin}
            disabled={!displayName.trim()}
            className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Session
          </button>
        </div>
      </div>
    );
  }

  if (!session || !connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Left Users Notification (Host Only) */}
      {isHost && leftUsers.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {leftUsers.map((userName, index) => (
            <div
              key={index}
              className="bg-orange-100 border border-orange-300 rounded-lg px-4 py-3 shadow-lg animate-slide-in"
            >
              <p className="text-orange-900 font-medium">
                👋 {userName} left the session
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session.name}
            </h1>
            <p className="text-sm text-gray-600">
              Stage: {session.stage.replace('_', ' ').toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <Timer />

            {/* Participants */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {users.slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    style={{ backgroundColor: user.color }}
                    title={user.displayName}
                  >
                    {user.displayName[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {users.length} participant{users.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="flex items-center gap-2">
                {/* Previous Stage Button - Only show if not at SETUP stage */}
                {session.stage !== SessionStage.SETUP && (
                  <button
                    onClick={previousStage}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Go to previous stage"
                  >
                    ← Previous
                  </button>
                )}

                {/* Next Stage Button - Hide at COMPLETE stage */}
                {session.stage !== SessionStage.COMPLETE && (
                  <button
                    onClick={advanceStage}
                    className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Next Stage →
                  </button>
                )}
              </div>
            )}

            {/* Export */}
            {(isHost || session.stage === SessionStage.COMPLETE) && (
              <button
                onClick={exportSession}
                className="bg-secondary hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Export
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stage Pipeline */}
      <StagePipeline currentStage={session.stage} />

      {/* Stage Content */}
      <main className="p-6">
        {session.stage === SessionStage.SETUP && <SetupStage />}
        {session.stage === SessionStage.ICE_BREAKER && <IceBreakerStage />}
        {session.stage === SessionStage.REFLECT && <ReflectStage />}
        {session.stage === SessionStage.GROUP && <GroupStage />}
        {session.stage === SessionStage.VOTE && <VoteStage />}
        {session.stage === SessionStage.ACT && <ActStage />}
        {session.stage === SessionStage.COMPLETE && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Retrospective Complete! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for participating. You can export the results using the Export button.
            </p>
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
