'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [joinUrl, setJoinUrl] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoinSession = () => {
    setJoinError('');

    if (!joinUrl.trim()) {
      setJoinError('Please enter a session URL or ID');
      return;
    }

    // Extract session ID from URL or use as-is if it's just an ID
    let sessionId = joinUrl.trim();

    // If it's a full URL, extract the session ID
    const urlMatch = joinUrl.match(/\/session\/([a-zA-Z0-9-]+)/);
    if (urlMatch) {
      sessionId = urlMatch[1];
    }

    // Navigate to session
    router.push(`/session/${sessionId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinSession();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🎯</div>
              <h1 className="text-xl font-bold text-gray-900">VibeRetro</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-primary hover:text-indigo-700 font-medium"
            >
              My Sessions
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              ⚡ Zero-Config Setup
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Real-Time Sprint
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Retrospectives
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Run collaborative team retrospectives with no login required.
            Create cards, group insights, vote on priorities, and define action items—all in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => router.push('/create')}
              className="w-full sm:w-auto bg-primary hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start a Retrospective
            </button>

            <div className="w-full sm:w-auto flex gap-2">
              <input
                type="text"
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste session URL or ID"
                className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleJoinSession}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 transition-colors"
              >
                Join
              </button>
            </div>
          </div>

          {joinError && (
            <p className="text-red-600 text-sm">{joinError}</p>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-2">No Login Required</h3>
              <p className="text-sm text-gray-600">
                Start instantly. Share the URL with your team and begin collaborating.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Sync</h3>
              <p className="text-sm text-gray-600">
                See everyone's contributions instantly with live cursors and updates.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Structured Process</h3>
              <p className="text-sm text-gray-600">
                Guided stages from ice breaker to action items keep your retro focused.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              A structured approach to effective retrospectives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Stage 1 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup & Ice Breaker</h3>
                  <p className="text-gray-600">
                    The host creates a session, configures the template, and team members join.
                    Start with a warm-up activity to get everyone engaged.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Reflect</h3>
                  <p className="text-gray-600">
                    Team members anonymously create cards with their thoughts.
                    Cards are initially blurred to encourage honest, independent thinking.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Group</h3>
                  <p className="text-gray-600">
                    Collaboratively cluster similar cards by dragging and dropping.
                    Identify common themes and patterns across the team.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Vote</h3>
                  <p className="text-gray-600">
                    Use dot voting to prioritize the most important topics.
                    Each team member gets a set number of votes to distribute.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Act</h3>
                  <p className="text-gray-600">
                    Define concrete action items based on top-voted topics.
                    Assign owners and set clear next steps for improvement.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 6 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  6
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Export & Complete</h3>
                  <p className="text-gray-600">
                    Export your retrospective as markdown with all cards, clusters,
                    votes, and action items for future reference.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Two Roles, One Goal</h2>
            <p className="text-xl text-gray-600">
              Everyone contributes, but someone needs to guide the process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Host Role */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Host</h3>
                  <p className="text-sm text-indigo-600 font-medium">Facilitator & Guide</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                The host creates the session and facilitates the retrospective.
                They control the flow but everyone participates equally.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Configure session template and settings</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Advance through retro stages</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Control timers and reveals</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Export final retrospective results</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Participate fully like any team member</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-indigo-200">
                <button
                  onClick={() => router.push('/create')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Create Session as Host
                </button>
              </div>
            </div>

            {/* Participant Role */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Participant</h3>
                  <p className="text-sm text-green-600 font-medium">Team Member</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Participants join with a shared URL from the host.
                They contribute ideas, cluster insights, and vote on priorities.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Join instantly with session URL</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Create and edit retrospective cards</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Collaborate on clustering and grouping</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Vote on important topics</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Contribute to action items</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-green-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Ask your host for the session URL
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Paste URL or session ID"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={handleJoinSession}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Template</h2>
            <p className="text-xl text-gray-600">
              Pick the retrospective format that works best for your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start, Stop, Continue</h3>
              <p className="text-gray-600 text-sm mb-3">
                What should we start doing, stop doing, and continue doing?
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Start</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Stop</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Continue</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Went Well, To Improve</h3>
              <p className="text-gray-600 text-sm mb-3">
                What went well and what can we improve?
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Went Well</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">To Improve</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">4 Ls</h3>
              <p className="text-gray-600 text-sm mb-3">
                Liked, Learned, Lacked, Longed For
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">Liked</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Learned</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">Lacked</span>
                <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">Longed For</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mad, Sad, Glad</h3>
              <p className="text-gray-600 text-sm mb-3">
                Express feelings about the sprint
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Mad</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Sad</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Glad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Improve Your Retrospectives?</h2>
            <p className="text-xl mb-8 text-indigo-100">
              Start collaborating with your team in seconds
            </p>
            <button
              onClick={() => router.push('/create')}
              className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Create Your First Retrospective
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            VibeRetro - Real-time collaborative retrospectives with zero-config setup
          </p>
          <p className="text-xs mt-2">
            Sessions are automatically cleaned up after 24 hours of inactivity
          </p>
        </div>
      </footer>
    </div>
  );
}
