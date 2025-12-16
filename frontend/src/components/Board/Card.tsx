'use client';

import { Card as CardType, User } from '../../types';
import { useSession } from '../../context/SessionContext';

interface CardProps {
  card: CardType;
  votes: number;
  onDragStart?: (card: CardType) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (card: CardType) => void;
  onVote?: () => void;
  canVote?: boolean;
  canDrag?: boolean;
  blurred?: boolean;
}

export default function Card({
  card,
  votes,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onVote,
  canVote = false,
  canDrag = false,
  blurred = false
}: CardProps) {
  const { users, currentUser, deleteCard, session } = useSession();
  const author = users.find(u => u.id === card.userId);
  const isOwnCard = currentUser?.id === card.userId;

  return (
    <div
      draggable={canDrag}
      onDragStart={() => onDragStart && onDragStart(card)}
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
          onDrop(card);
        }
      }}
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all hover:shadow-lg ${
        canDrag ? 'cursor-move' : ''
      } ${blurred ? 'blur-sm' : ''} card-enter`}
      style={{ borderLeftColor: author?.color || '#999' }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: author?.color || '#999' }}
          >
            {author?.displayName[0].toUpperCase() || '?'}
          </div>
          {!blurred && (
            <span className="text-xs text-gray-600">
              {author?.displayName || 'Unknown'}
            </span>
          )}
        </div>

        {isOwnCard && !blurred && (
          <button
            onClick={() => deleteCard(card.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <p className={`text-gray-900 ${blurred ? 'select-none' : ''}`}>
        {blurred ? '••••••••••' : card.content}
      </p>

      {canVote && votes !== undefined && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onVote}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            Vote
          </button>
          {session?.votesRevealed && votes > 0 && (
            <span className="text-sm font-semibold text-gray-700">
              {votes} vote{votes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
