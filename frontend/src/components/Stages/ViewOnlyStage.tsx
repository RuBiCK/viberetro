'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Cluster, ActionItem, SessionStatus } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';

interface ViewOnlyStageProps {
  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  cards: Card[];
  clusters: Cluster[];
  actionItems: ActionItem[];
  columns: string[];
  completedAt?: number;
  participantCount: number;
}

export default function ViewOnlyStage({
  sessionId,
  sessionName,
  status,
  cards,
  clusters,
  actionItems,
  columns,
  completedAt,
  participantCount
}: ViewOnlyStageProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      archived: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[status] || styles.completed;
  };

  const getCardsByColumn = (column: string) => {
    return cards.filter(c => c.column === column && !c.clusterId);
  };

  const getClustersByColumn = (column: string) => {
    return clusters.filter(cl => cl.column === column);
  };

  const getCardsInCluster = (clusterId: string) => {
    return cards.filter(c => c.clusterId === clusterId);
  };

  // Sticky note colors
  const stickyNoteColors = [
    { bg: '#FFE5B4', text: '#2c1810', border: '#FFD700' },
    { bg: '#FFB6C1', text: '#4a1428', border: '#FF69B4' },
    { bg: '#DDA0DD', text: '#3d1a3d', border: '#DA70D6' },
    { bg: '#98FB98', text: '#0d3a0d', border: '#00FF00' },
    { bg: '#87CEEB', text: '#0a2a3d', border: '#4682B4' },
    { bg: '#F0E68C', text: '#3d3a0a', border: '#FFD700' },
    { bg: '#FFA07A', text: '#3d1a0a', border: '#FF6347' },
    { bg: '#DEB887', text: '#2c1f10', border: '#D2691E' },
    { bg: '#FFB347', text: '#3d2210', border: '#FF8C00' },
    { bg: '#B0E0E6', text: '#0a2a3d', border: '#5F9EA0' },
  ];

  const getCardColor = (cardId: string) => {
    const colorIndex = cardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % stickyNoteColors.length;
    return stickyNoteColors[colorIndex];
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export session');
      }

      const data = await response.json();

      // Download markdown file
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionName.replace(/[^a-z0-9]/gi, '-')}-retrospective.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export session. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {sessionName}
                </h1>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusBadge()}`}>
                  {status === 'archived' ? 'Archived' : 'Completed'}
                </span>
              </div>
              {completedAt && (
                <p className="text-sm text-gray-600">
                  Completed on {formatDate(completedAt)} • {participantCount} participants
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-primary hover:text-indigo-700 font-medium underline"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              View-only mode: This session is {status === 'archived' ? 'archived' : 'completed'} and cannot be edited
            </p>
          </div>
        </div>

        {/* Retrospective Board */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Retrospective Cards</h2>
          <div className={`grid gap-4 ${
            columns.length === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
            columns.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {columns.map(column => {
              const columnCards = getCardsByColumn(column);
              const columnClusters = getClustersByColumn(column);

              return (
                <div key={column} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {column}
                  </h3>

                  <div className="space-y-3">
                    {/* Clusters */}
                    {columnClusters.map(cluster => {
                      const clusterCards = getCardsInCluster(cluster.id);
                      return (
                        <div key={cluster.id} className="border-2 border-purple-300 rounded-xl p-3 bg-purple-50">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            <h4 className="font-semibold text-sm text-purple-900">{cluster.name}</h4>
                            <span className="text-xs text-purple-600 ml-auto">
                              {clusterCards.length} cards
                            </span>
                          </div>
                          <div className="space-y-2">
                            {clusterCards.map(card => {
                              const cardColor = getCardColor(card.id);
                              return (
                                <div
                                  key={card.id}
                                  className="rounded-lg shadow-sm p-3 text-sm"
                                  style={{
                                    backgroundColor: cardColor.bg,
                                    border: `2px solid ${cardColor.border}`,
                                    transform: `rotate(${(card.id.charCodeAt(0) % 3) - 1}deg)`
                                  }}
                                >
                                  <MarkdownRenderer content={card.content} textColor={cardColor.text} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Standalone Cards */}
                    {columnCards.map(card => {
                      const cardColor = getCardColor(card.id);
                      return (
                        <div
                          key={card.id}
                          className="rounded-lg shadow-sm p-3 text-sm"
                          style={{
                            backgroundColor: cardColor.bg,
                            border: `2px solid ${cardColor.border}`,
                            transform: `rotate(${(card.id.charCodeAt(0) % 3) - 1}deg)`
                          }}
                        >
                          <MarkdownRenderer content={card.content} textColor={cardColor.text} />
                        </div>
                      );
                    })}

                    {columnCards.length === 0 && columnClusters.length === 0 && (
                      <p className="text-sm text-gray-400 italic text-center py-8">
                        No cards in this column
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Action Items ({actionItems.length})
            </h2>
            <div className="space-y-3">
              {actionItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.completed
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {item.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.task}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Owner: {item.owner}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {cards.length === 0 && actionItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Content
            </h3>
            <p className="text-gray-600">
              This session doesn't have any cards or action items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
