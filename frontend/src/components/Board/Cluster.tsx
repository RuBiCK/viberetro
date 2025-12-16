'use client';

import { useState } from 'react';
import { Cluster as ClusterType, Card as CardType } from '../../types';
import { useSession } from '../../context/SessionContext';
import Card from './Card';

interface ClusterProps {
  cluster: ClusterType;
  cards: CardType[];
  totalVotes: number;
  onDragStart?: (cluster: ClusterType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (cluster: ClusterType) => void;
  onVote?: () => void;
  canVote?: boolean;
  canDrag?: boolean;
}

export default function Cluster({
  cluster,
  cards,
  totalVotes,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onVote,
  canVote = false,
  canDrag = false
}: ClusterProps) {
  const { ungroupCluster, updateCluster, getTargetVotes, session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [clusterName, setClusterName] = useState(cluster.name);
  const [isHovered, setIsHovered] = useState(false);

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
      className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-lg p-4 border-2 border-purple-200 transition-all ${canDrag ? 'cursor-move' : ''}`}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {canDrag && (
              <div className="cursor-move text-purple-600" title="Drag to merge">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
            )}
            <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
              CLUSTER
            </div>
            <span className="text-sm text-gray-700">
              {cards.length} card{cards.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {session?.votesRevealed && totalVotes > 0 && (
              <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-600 hover:text-purple-800"
              title="Expand/Collapse"
            >
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => ungroupCluster(cluster.id)}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Ungroup cluster"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />
            <button
              onClick={handleNameSave}
              className="text-green-600 hover:text-green-800"
              title="Save"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleNameCancel}
              className="text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h4 className="text-base font-semibold text-gray-900">{cluster.name}</h4>
            <button
              onClick={() => setIsEditingName(true)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity"
              title="Rename cluster"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded ? (
        <div className="space-y-3">
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
        <div className={`relative transition-all duration-300 ${isHovered ? 'min-h-96' : 'h-40'} overflow-visible`}>
          {cards.slice(0, Math.min(cards.length, isHovered ? 5 : 4)).map((card, index) => (
            <div
              key={card.id}
              className="absolute bg-white rounded-lg shadow-lg p-4 w-full border-l-4 border-purple-400 transition-all duration-300"
              style={{
                top: `${index * (isHovered ? 90 : 12)}px`,
                left: `${index * (isHovered ? 15 : 10)}px`,
                zIndex: 10 - index,
                transform: isHovered ? 'scale(1)' : 'scale(0.98)',
                minHeight: isHovered ? '120px' : 'auto'
              }}
            >
              <p className={`text-sm text-gray-700 ${isHovered ? '' : 'line-clamp-2'}`}>
                {card.content}
              </p>
            </div>
          ))}
          {cards.length > (isHovered ? 5 : 4) && (
            <div className="absolute bottom-0 right-0 bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow-lg z-20">
              +{cards.length - (isHovered ? 5 : 4)} more
            </div>
          )}
        </div>
      )}

      {canVote && (
        <button
          onClick={onVote}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          Vote for Cluster
        </button>
      )}
    </div>
  );
}
