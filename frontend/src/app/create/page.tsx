'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '../../lib/api';
import { TemplateType, TEMPLATES } from '../../types';

export default function CreateSessionPage() {
  const router = useRouter();
  const [name, setName] = useState('Sprint Retrospective');
  const [template, setTemplate] = useState<TemplateType>(TemplateType.START_STOP_CONTINUE);
  const [timerDuration, setTimerDuration] = useState(5);
  const [votesPerUser, setVotesPerUser] = useState(3);
  const [iceBreaker, setIceBreaker] = useState('Share something interesting about your week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await createSession({
        name,
        template,
        timerDuration: timerDuration * 60, // Convert to seconds
        votesPerUser,
        iceBreaker
      });

      // Store host ID in localStorage
      localStorage.setItem(`host_${response.sessionId}`, response.hostId);

      // Redirect to session page
      router.push(`/session/${response.sessionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-900 hover:text-indigo-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-primary hover:text-indigo-700 font-medium"
            >
              My Sessions
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Retrospective
            </h1>
            <p className="text-gray-600">
              Configure your session and share the URL with your team
            </p>
          </div>

          <div className="space-y-6">
            {/* Session Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sprint Retrospective"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(TEMPLATES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setTemplate(key as TemplateType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      template === key
                        ? 'border-primary bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {value.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {value.columns.join(' • ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timer Duration (minutes per stage)
              </label>
              <input
                type="number"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 5)}
                min="1"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Votes Per User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votes Per User
              </label>
              <input
                type="number"
                value={votesPerUser}
                onChange={(e) => setVotesPerUser(parseInt(e.target.value) || 3)}
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Ice Breaker Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ice Breaker Question
              </label>
              <input
                type="text"
                value={iceBreaker}
                onChange={(e) => setIceBreaker(e.target.value)}
                placeholder="Share something interesting about your week"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Session...' : 'Create Session'}
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">🚀</div>
                <div className="text-sm font-medium text-gray-900">Zero Config</div>
                <div className="text-xs text-gray-600">No login required</div>
              </div>
              <div>
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-sm font-medium text-gray-900">Real-time</div>
                <div className="text-xs text-gray-600">Instant updates</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-sm font-medium text-gray-900">Simple</div>
                <div className="text-xs text-gray-600">Easy to use</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
