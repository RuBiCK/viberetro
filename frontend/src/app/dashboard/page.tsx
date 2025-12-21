'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionSummary, SessionStatus } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');

  useEffect(() => {
    fetchSessions();
  }, [searchTerm, statusFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all session IDs from localStorage (user_* and host_* keys)
      const sessionIds = new Set<string>();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Extract session IDs from user_${sessionId} and host_${sessionId}
          const userMatch = key.match(/^user_(.+)$/);
          const hostMatch = key.match(/^host_(.+)$/);

          if (userMatch) sessionIds.add(userMatch[1]);
          if (hostMatch) sessionIds.add(hostMatch[1]);
        }
      }

      // Fetch each session details from backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const sessionPromises = Array.from(sessionIds).map(async (sessionId) => {
        try {
          // Get userId for this session from localStorage
          const userId = localStorage.getItem(`user_${sessionId}`);
          if (!userId) return null;

          const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/history?userId=${userId}`);
          if (!response.ok) return null;

          const data = await response.json();
          const session = data.session;

          // Build summary with actual counts
          return {
            id: session.id,
            name: session.name,
            stage: session.stage,
            status: session.status,
            participantCount: data.users?.length || 0,
            cardCount: data.cards?.length || 0,
            actionItemCount: data.actionItems?.length || 0,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            completedAt: session.completedAt
          } as SessionSummary;
        } catch {
          return null;
        }
      });

      const allSessions = (await Promise.all(sessionPromises)).filter(Boolean) as SessionSummary[];

      // Apply filters
      let filteredSessions = allSessions;

      if (statusFilter !== 'all') {
        filteredSessions = filteredSessions.filter(s => s.status === statusFilter);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredSessions = filteredSessions.filter(s =>
          s.name.toLowerCase().includes(term)
        );
      }

      // Sort by most recent first
      filteredSessions.sort((a, b) => b.createdAt - a.createdAt);

      setSessions(filteredSessions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string, status: SessionStatus) => {
    // For completed/archived sessions, go to history view
    if (status === 'completed' || status === 'archived') {
      router.push(`/session/${sessionId}/history`);
    } else {
      // For active sessions, go to live session
      router.push(`/session/${sessionId}`);
    }
  };

  const handleCreateNew = () => {
    router.push('/');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getStageDisplay = (stage: string) => {
    const stages: Record<string, string> = {
      setup: 'Setup',
      ice_breaker: 'Ice Breaker',
      reflect: 'Reflect',
      group: 'Group',
      vote: 'Vote',
      act: 'Act',
      complete: 'Complete'
    };
    return stages[stage] || stage;
  };

  const getStatusBadge = (status: SessionStatus) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      archived: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[status] || styles.active;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My Retrospectives
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              View and manage your retrospective sessions
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="w-full md:w-auto bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Session
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Sessions
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm md:text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm md:text-base"
              >
                <option value="all">All Sessions</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No sessions found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first retrospective session to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreateNew}
                className="bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Session
              </button>
            )}
          </div>
        )}

        {/* Session List */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session.id, session.status)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer p-4 md:p-6 border border-gray-100 hover:border-primary active:scale-95"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusBadge(session.status)}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getStageDisplay(session.stage)}
                  </span>
                </div>

                {/* Session Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {session.name}
                </h3>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{session.participantCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    <span>{session.cardCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{session.actionItemCount}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Created {formatDate(session.createdAt)}</span>
                  </div>
                  {session.completedAt && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Completed {formatDate(session.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sessions are automatically cleaned up after 24 hours of inactivity</p>
        </div>
      </div>
    </div>
  );
}
