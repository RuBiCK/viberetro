'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '../context/SessionContext';

export default function Timer() {
  const { session, isHost, startTimer, socket } = useSession();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [milestoneAlert, setMilestoneAlert] = useState<string | null>(null);
  const prevSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('timer:tick', (data: { remainingSeconds: number }) => {
      const newSeconds = data.remainingSeconds;
      const prevSeconds = prevSecondsRef.current;

      setRemainingSeconds(newSeconds);

      // Check for milestone crossings (only trigger when crossing, not every second)
      const milestones = [300, 60, 30, 10, 5]; // 5min, 1min, 30s, 10s, 5s
      for (const milestone of milestones) {
        if (prevSeconds !== null && prevSeconds > milestone && newSeconds <= milestone && newSeconds > 0) {
          const label = milestone >= 60
            ? `${milestone / 60} minute${milestone > 60 ? 's' : ''}`
            : `${milestone} seconds`;
          setMilestoneAlert(label);
          setTimeout(() => setMilestoneAlert(null), 2000);
          break;
        }
      }

      prevSecondsRef.current = newSeconds;
    });

    return () => {
      socket.off('timer:tick');
    };
  }, [socket]);

  const handleStartTimer = () => {
    if (isHost && inputMinutes > 0) {
      startTimer(inputMinutes * 60);
      setShowInput(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isHost && remainingSeconds === null) {
    return null;
  }

  if (showInput && isHost) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
        <input
          type="number"
          value={inputMinutes}
          onChange={(e) => setInputMinutes(parseInt(e.target.value) || 1)}
          min="1"
          max="60"
          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          autoFocus
        />
        <span className="text-sm text-gray-600">min</span>
        <button
          onClick={handleStartTimer}
          className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
        >
          Start
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (remainingSeconds !== null && remainingSeconds >= 0) {
    return (
      <>
        {/* Milestone Alert */}
        {milestoneAlert && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="animate-pulse">
              <div className="bg-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
                <div className="text-4xl font-bold mb-2">⏰</div>
                <div className="text-2xl font-bold">{milestoneAlert}</div>
                <div className="text-lg">remaining!</div>
              </div>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          remainingSeconds <= 10 ? 'bg-red-500 text-white animate-pulse' :
          remainingSeconds <= 30 ? 'bg-orange-100 text-orange-700' :
          remainingSeconds <= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono font-medium">
            {formatTime(remainingSeconds)}
          </span>
        </div>
      </>
    );
  }

  if (isHost) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">Start Timer</span>
      </button>
    );
  }

  return null;
}
