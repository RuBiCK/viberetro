'use client';

import React from 'react';
import { Card as CardType, Cluster as ClusterType } from '../../types';
import { useSession } from '../../context/SessionContext';
import Card from './Card';
import Cluster from './Cluster';

interface ColumnProps {
  title: string;
  cards: CardType[];
  clusters: ClusterType[];
  onDragStart?: (item: CardType | ClusterType, type: 'card' | 'cluster') => void;
  onDragEnd?: () => void;
  onDrop?: (item: CardType | ClusterType, type: 'card' | 'cluster') => void;
  onColumnDrop?: (columnName: string) => void;
  canVote?: boolean;
  canDrag?: boolean;
  showBlurred?: boolean;
  isVoteStage?: boolean;
  canAddCards?: boolean;
}

export default function Column({
  title,
  cards,
  clusters,
  onDragStart,
  onDragEnd,
  onDrop,
  onColumnDrop,
  canVote = false,
  canDrag = false,
  showBlurred = false,
  isVoteStage = false,
  canAddCards = true
}: ColumnProps) {
  const { createCard, currentUser, toggleVote, getTargetVotes, getUserVoteCount, session } = useSession();
  const [newCardContent, setNewCardContent] = React.useState('');
  const [dragOverItemId, setDragOverItemId] = React.useState<string | null>(null);

  const handleCreateCard = () => {
    if (newCardContent.trim() && currentUser) {
      createCard({
        userId: currentUser.id,
        column: title,
        content: newCardContent.trim(),
        position: { x: 0, y: 0 },
        clusterId: null,
        isRevealed: false
      });
      setNewCardContent('');
    }
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(itemId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, target: CardType | ClusterType, type: 'card' | 'cluster') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
    if (onDrop) {
      onDrop(target, type);
    }
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the column container itself, not child elements
    if (e.currentTarget === e.target) {
      setDragOverItemId(null);
    }
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
    // Move card/cluster to this column without clustering
    if (onColumnDrop) {
      onColumnDrop(title);
    }
  };

  // Filter cards that are not in clusters and sort by newest first
  const standaloneCards = cards
    .filter(card => !card.clusterId)
    .sort((a, b) => b.createdAt - a.createdAt); // Newest cards on top

  // Sort clusters by newest first
  const sortedClusters = [...clusters].sort((a, b) => b.createdAt - a.createdAt);

  const userVoteCount = currentUser ? getUserVoteCount(currentUser.id) : 0;
  const maxVotes = session?.settings.votesPerUser || 3;
  const canStillVote = userVoteCount < maxVotes;

  // Spotify-wrapped theme mapping based on column order
  const getColumnTheme = (title: string, columnIndex: number) => {
    const themes = [
      {
        icon: '🎵',
        themeColor: 'var(--accent-green)',
        bgClass: 'bg-gradient-to-br from-green-900/20 to-green-800/10',
        borderClass: 'border-green-500/30',
        iconBg: 'bg-green-500/20',
      },
      {
        icon: '🎨',
        themeColor: 'var(--accent-purple)',
        bgClass: 'bg-gradient-to-br from-purple-900/20 to-purple-800/10',
        borderClass: 'border-purple-500/30',
        iconBg: 'bg-purple-500/20',
      },
      {
        icon: '🔧',
        themeColor: 'var(--accent-orange)',
        bgClass: 'bg-gradient-to-br from-orange-900/20 to-orange-800/10',
        borderClass: 'border-orange-500/30',
        iconBg: 'bg-orange-500/20',
      }
    ];

    return {
      ...themes[columnIndex % themes.length],
      themeTitle: title
    };
  };

  // Get column index from session settings
  const columnIndex = session?.settings.columns.indexOf(title) || 0;
  const theme = getColumnTheme(title, columnIndex);

  return (
    <div
      className={`${theme.bgClass} ${theme.borderClass} border-2 rounded-lg p-3 flex flex-col min-h-[400px] transition-all hover:border-opacity-60`}
      onDragOver={canDrag ? handleColumnDragOver : undefined}
      onDragLeave={canDrag ? handleColumnDragLeave : undefined}
      onDrop={canDrag ? handleColumnDrop : undefined}
    >
      {/* Compact Column Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`${theme.iconBg} w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm`}>
            {theme.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-gray-900">
              {theme.themeTitle}
            </h3>
          </div>
          <span className="text-base font-bold" style={{ color: theme.themeColor }}>
            {standaloneCards.length + sortedClusters.length}
          </span>
        </div>
      </div>

      {/* Compact Card Input */}
      {canAddCards && (
        <div className="mb-3">
          <textarea
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreateCard();
              }
            }}
            placeholder="Add a card..."
            className="w-full px-3 py-2 resize-none text-sm"
            rows={2}
          />
          <button
            onClick={handleCreateCard}
            disabled={!newCardContent.trim()}
            className="mt-1.5 w-full text-white font-bold py-2 rounded-full text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            style={{ backgroundColor: theme.themeColor }}
          >
            Add Card
          </button>
        </div>
      )}

      {/* Cards and Clusters */}
      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
        {/* Standalone Cards */}
        {standaloneCards.map(card => {
          const isOwnCard = currentUser?.id === card.userId;
          const isDraggedOver = dragOverItemId === card.id;
          return (
            <div
              key={card.id}
              className={`transition-all ${isDraggedOver ? 'ring-4 ring-purple-400 rounded-lg' : ''}`}
            >
              <Card
                card={card}
                votes={getTargetVotes(card.id).length}
                onDragStart={() => canDrag && onDragStart && onDragStart(card, 'card')}
                onDragEnd={canDrag ? onDragEnd : undefined}
                onDragOver={canDrag ? (e) => handleDragOver(e, card.id) : undefined}
                onDragLeave={canDrag ? handleDragLeave : undefined}
                onDrop={canDrag ? () => onDrop && onDrop(card, 'card') : undefined}
                onVote={() => toggleVote(card.id, 'card')}
                canVote={canVote && canStillVote}
                canDrag={canDrag}
                blurred={showBlurred && !card.isRevealed && !isOwnCard}
                isVoteStage={isVoteStage}
              />
            </div>
          );
        })}

        {/* Clusters */}
        {sortedClusters.map(cluster => {
          const clusterCards = cards.filter(c => cluster.cardIds.includes(c.id));
          const clusterVotes = getTargetVotes(cluster.id).length;
          const cardVotes = clusterCards.reduce((sum, card) =>
            sum + getTargetVotes(card.id).length, 0
          );
          const totalVotes = clusterVotes + cardVotes;
          const isDraggedOver = dragOverItemId === cluster.id;

          return (
            <div
              key={cluster.id}
              className={`transition-all ${isDraggedOver ? 'ring-4 ring-purple-400 rounded-lg' : ''}`}
            >
              <Cluster
                cluster={cluster}
                cards={clusterCards}
                totalVotes={totalVotes}
                onDragStart={() => canDrag && onDragStart && onDragStart(cluster, 'cluster')}
                onDragEnd={canDrag ? onDragEnd : undefined}
                onDragOver={canDrag ? (e) => handleDragOver(e, cluster.id) : undefined}
                onDragLeave={canDrag ? handleDragLeave : undefined}
                onDrop={canDrag ? () => onDrop && onDrop(cluster, 'cluster') : undefined}
                onVote={() => toggleVote(cluster.id, 'cluster')}
                canVote={canVote && canStillVote}
                canDrag={canDrag}
                isVoteStage={isVoteStage}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
