'use client';

import { useState } from 'react';
import { Cluster as ClusterType, Card as CardType } from '../../types';
import { useSession } from '../../context/SessionContext';
import Card from './Card';
import MarkdownRenderer from '../MarkdownRenderer';

interface ClusterProps {
  cluster: ClusterType;
  cards: CardType[];
  totalVotes: number;
  onDragStart?: (cluster: ClusterType) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (cluster: ClusterType) => void;
  onVote?: () => void;
  canVote?: boolean;
  canDrag?: boolean;
  isVoteStage?: boolean;
}

export default function Cluster({
  cluster,
  cards,
  totalVotes,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onVote,
  canVote = false,
  canDrag = false,
  isVoteStage = false
}: ClusterProps) {
  const { ungroupCluster, updateCluster, getTargetVotes, session, votes: allVotes, currentUser, hasUserVoted } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [clusterName, setClusterName] = useState(cluster.name);
  const [isHovered, setIsHovered] = useState(false);
  const hasVoted = hasUserVoted(cluster.id);

  // Get user's vote number for this cluster (if they voted for it)
  const getUserVoteNumber = () => {
    if (!currentUser) return null;

    // Get all user's votes sorted by creation time
    const userVotes = allVotes
      .filter(v => v.userId === currentUser.id)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Find if this cluster was voted for
    const voteIndex = userVotes.findIndex(v => v.targetId === cluster.id);
    return voteIndex >= 0 ? voteIndex + 1 : null;
  };

  const userVoteNumber = getUserVoteNumber();

  const handleNameSave = () => {
    if (clusterName.trim() && clusterName !== cluster.name) {
      updateCluster(cluster.id, { name: clusterName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setClusterName(cluster.name);
    setIsEditingName(false);
  };

  return (
    <div
      draggable={canDrag}
      onDragStart={() => {
        console.log('🎯 Cluster drag started:', cluster.id, 'canDrag:', canDrag);
        if (onDragStart) {
          onDragStart(cluster);
        }
      }}
      onDragEnd={() => onDragEnd && onDragEnd()}
      onDragOver={(e) => {
        if (onDragOver) {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e);
        }
      }}
      onDragLeave={(e) => {
        if (onDragLeave) {
          e.preventDefault();
          e.stopPropagation();
          onDragLeave(e);
        }
      }}
      onDrop={(e) => {
        if (onDrop) {
          e.preventDefault();
          e.stopPropagation();
          onDrop(cluster);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`spotify-card border-2 rounded-lg shadow-md p-3 transition-all hover:border-purple-400 active:scale-95 ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${
        hasVoted && isVoteStage ? 'border-purple-600 ring-4 ring-purple-500 ring-offset-2 bg-purple-50' : 'border-purple-300'
      }`}
    >
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {canDrag && (
              <div className="cursor-grab text-purple-600" title="Drag to merge">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
            )}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">
              📦 CLUSTER
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {cards.length} card{cards.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {session?.votesRevealed && totalVotes > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-black border border-purple-300">
                {totalVotes} 👍
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-600 hover:text-purple-700 transition-colors"
              title="Expand/Collapse"
            >
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => ungroupCluster(cluster.id)}
              className="text-gray-500 hover:text-orange-600 transition-colors"
              title="Ungroup cluster"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cluster Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') handleNameCancel();
              }}
              className="flex-1 px-3 py-2 text-sm"
              autoFocus
            />
            <button
              onClick={handleNameSave}
              className="text-green-600 hover:text-green-700 transition-colors"
              title="Save"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleNameCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Cancel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h4 className="text-base font-black text-gray-900 flex-1">{cluster.name}</h4>
            <button
              onClick={() => setIsEditingName(true)}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-purple-600 transition-opacity"
              title="Rename cluster"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded ? (
        <div className="space-y-2">
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              votes={getTargetVotes(card.id).length}
              canVote={false}
              canDrag={false}
            />
          ))}
        </div>
      ) : (
        <div className={`relative transition-all duration-300 ${isHovered ? 'min-h-64' : 'h-28'} overflow-visible`}>
          {cards.slice(0, Math.min(cards.length, isHovered ? 4 : 3)).map((card, index) => (
            <div
              key={card.id}
              className="absolute rounded-lg shadow-md p-2 w-full transition-all duration-300 border-2"
              style={{
                backgroundColor: '#FFE5B4',
                borderColor: '#FFD700',
                top: `${index * (isHovered ? 60 : 8)}px`,
                left: `${index * (isHovered ? 10 : 6)}px`,
                zIndex: 10 - index,
                transform: isHovered ? 'scale(1)' : 'scale(0.98)',
                minHeight: isHovered ? '80px' : 'auto'
              }}
            >
              <div className={`text-xs font-medium ${isHovered ? '' : 'line-clamp-2'}`}>
                <MarkdownRenderer content={card.content} textColor="#2c1810" />
              </div>
            </div>
          ))}
          {cards.length > (isHovered ? 4 : 3) && (
            <div className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-[10px] font-black shadow-md z-20">
              +{cards.length - (isHovered ? 4 : 3)}
            </div>
          )}
        </div>
      )}

      {isVoteStage && (
        <button
          onClick={onVote}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 text-white py-2 rounded-full text-xs font-black transition-all shadow-md hover:scale-105 ${
            hasVoted
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
          }`}
        >
          {hasVoted ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
              <span>Voted #{userVoteNumber} - Click to Remove</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>Vote for Cluster</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
