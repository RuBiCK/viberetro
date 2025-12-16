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
  onDrop?: (item: CardType | ClusterType, type: 'card' | 'cluster') => void;
  onColumnDrop?: (columnName: string) => void;
  canVote?: boolean;
  canDrag?: boolean;
  showBlurred?: boolean;
}

export default function Column({
  title,
  cards,
  clusters,
  onDragStart,
  onDrop,
  onColumnDrop,
  canVote = false,
  canDrag = false,
  showBlurred = false
}: ColumnProps) {
  const { createCard, currentUser, castVote, getTargetVotes, getUserVoteCount, session } = useSession();
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

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Move card/cluster to this column without clustering
    if (onColumnDrop) {
      onColumnDrop(title);
    }
  };

  // Filter cards that are not in clusters
  const standaloneCards = cards.filter(card => !card.clusterId);

  const userVoteCount = currentUser ? getUserVoteCount(currentUser.id) : 0;
  const maxVotes = session?.settings.votesPerUser || 3;
  const canStillVote = userVoteCount < maxVotes;

  return (
    <div
      className="bg-gray-50 rounded-lg p-4 flex flex-col min-h-96"
      onDragOver={canDrag ? handleColumnDragOver : undefined}
      onDrop={canDrag ? handleColumnDrop : undefined}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-600">
          ({standaloneCards.length + clusters.length})
        </span>
      </h3>

      {/* New Card Input */}
      <div className="mb-4">
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          rows={3}
        />
        <button
          onClick={handleCreateCard}
          disabled={!newCardContent.trim()}
          className="mt-2 w-full bg-primary hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Card
        </button>
      </div>

      {canVote && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-900">
            <strong>Votes:</strong> {userVoteCount} / {maxVotes}
          </div>
        </div>
      )}

      {/* Cards and Clusters */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {/* Standalone Cards */}
        {standaloneCards.map(card => {
          const isOwnCard = currentUser?.id === card.userId;
          const isDraggedOver = dragOverItemId === card.id;
          return (
            <div
              key={card.id}
              className={`transition-all ${isDraggedOver ? 'ring-4 ring-green-400 rounded-lg' : ''}`}
            >
              <Card
                card={card}
                votes={getTargetVotes(card.id).length}
                onDragStart={() => canDrag && onDragStart && onDragStart(card, 'card')}
                onDragOver={canDrag ? (e) => handleDragOver(e, card.id) : undefined}
                onDragLeave={canDrag ? handleDragLeave : undefined}
                onDrop={canDrag ? () => onDrop && onDrop(card, 'card') : undefined}
                onVote={() => canStillVote && castVote(card.id, 'card')}
                canVote={canVote && canStillVote}
                canDrag={canDrag}
                blurred={showBlurred && !card.isRevealed && !isOwnCard}
              />
            </div>
          );
        })}

        {/* Clusters */}
        {clusters.map(cluster => {
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
              className={`transition-all ${isDraggedOver ? 'ring-4 ring-green-400 rounded-lg' : ''}`}
            >
              <Cluster
                cluster={cluster}
                cards={clusterCards}
                totalVotes={totalVotes}
                onDragStart={() => canDrag && onDragStart && onDragStart(cluster, 'cluster')}
                onDragOver={canDrag ? (e) => handleDragOver(e, cluster.id) : undefined}
                onDragLeave={canDrag ? handleDragLeave : undefined}
                onDrop={canDrag ? () => onDrop && onDrop(cluster, 'cluster') : undefined}
                onVote={() => canStillVote && castVote(cluster.id, 'cluster')}
                canVote={canVote && canStillVote}
                canDrag={canDrag}
              />
            </div>
          );
        })}
      </div>

      {standaloneCards.length === 0 && clusters.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No cards yet
        </div>
      )}
    </div>
  );
}
