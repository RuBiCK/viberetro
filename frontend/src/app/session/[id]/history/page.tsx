'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ViewOnlyStage from '../../../../components/Stages/ViewOnlyStage';
import { Session, Card, Cluster, ActionItem, Vote, User, IceBreaker } from '../../../../types';

export default function SessionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    session: Session;
    cards: Card[];
    clusters: Cluster[];
    actionItems: ActionItem[];
    votes: Vote[];
    users: User[];
    iceBreakers: IceBreaker[];
  } | null>(null);

  useEffect(() => {
    fetchSessionHistory();
  }, [sessionId]);

  const fetchSessionHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user ID from localStorage
      let userId = localStorage.getItem('dashboard_user_id');

      // Also check for session-specific user ID
      const sessionUserId = localStorage.getItem(`user_${sessionId}`);
      if (sessionUserId) {
        userId = sessionUserId;
      }

      if (!userId) {
        // If no user ID, create one (for new visitors viewing shared links)
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('dashboard_user_id', userId);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/history?userId=${userId}`);

      if (response.status === 403) {
        setError('Access denied: You do not have permission to view this session');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch session history');
      }

      const data = await response.json();
      setSessionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">The session you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get unique participant count from session_participants data
  const participantCount = sessionData.users.length;

  return (
    <ViewOnlyStage
      sessionId={sessionId}
      sessionName={sessionData.session.name}
      status={sessionData.session.status}
      cards={sessionData.cards}
      clusters={sessionData.clusters}
      actionItems={sessionData.actionItems}
      columns={sessionData.session.settings.columns}
      completedAt={sessionData.session.completedAt}
      participantCount={participantCount}
    />
  );
}
