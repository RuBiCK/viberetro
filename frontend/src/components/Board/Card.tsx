'use client';

import { useState } from 'react';
import { Card as CardType, User } from '../../types';
import { useSession } from '../../context/SessionContext';
import MarkdownRenderer from '../MarkdownRenderer';
import MarkdownEditor from '../MarkdownEditor';

interface CardProps {
  card: CardType;
  votes: number;
  onDragStart?: (card: CardType) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (card: CardType) => void;
  onVote?: () => void;
  canVote?: boolean;
  canDrag?: boolean;
  blurred?: boolean;
  isVoteStage?: boolean;
}

export default function Card({
  card,
  votes,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onVote,
  canVote = false,
  canDrag = false,
  blurred = false,
  isVoteStage = false
}: CardProps) {
  const { users, currentUser, deleteCard, updateCard, session, votes: allVotes, hasUserVoted, getTypingUsers, startTyping, stopTyping } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(card.content);
  const author = users.find(u => u.id === card.userId);
  const isOwnCard = currentUser?.id === card.userId;
  const hasVoted = hasUserVoted(card.id);
  const typingUsers = getTypingUsers(card.id).filter(u => u.id !== currentUser?.id);

  // Get user's vote number for this card (if they voted for it)
  const getUserVoteNumber = () => {
    if (!currentUser) return null;

    // Get all user's votes sorted by creation time
    const userVotes = allVotes
      .filter(v => v.userId === currentUser.id)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Find if this card was voted for
    const voteIndex = userVotes.findIndex(v => v.targetId === card.id);
    return voteIndex >= 0 ? voteIndex + 1 : null;
  };

  const userVoteNumber = getUserVoteNumber();

  // Spotify-style sticky note colors (varied palette)
  const stickyNoteColors = [
    { bg: '#FFE5B4', text: '#2c1810', border: '#FFD700' }, // Peach
    { bg: '#FFB6C1', text: '#4a1428', border: '#FF69B4' }, // Light Pink
    { bg: '#DDA0DD', text: '#3d1a3d', border: '#DA70D6' }, // Plum
    { bg: '#98FB98', text: '#0d3a0d', border: '#00FF00' }, // Pale Green
    { bg: '#87CEEB', text: '#0a2a3d', border: '#4682B4' }, // Sky Blue
    { bg: '#F0E68C', text: '#3d3a0a', border: '#FFD700' }, // Khaki
    { bg: '#FFA07A', text: '#3d1a0a', border: '#FF6347' }, // Light Salmon
    { bg: '#DEB887', text: '#2c1f10', border: '#D2691E' }, // Burlywood
    { bg: '#FFB347', text: '#3d2210', border: '#FF8C00' }, // Pastel Orange
    { bg: '#B0E0E6', text: '#0a2a3d', border: '#5F9EA0' }, // Powder Blue
  ];

  // Use card ID to consistently assign a color
  const colorIndex = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % stickyNoteColors.length;
  const cardColor = stickyNoteColors[colorIndex];

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== card.content) {
      updateCard(card.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(card.content);
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    if (isOwnCard && !blurred && !isEditing) {
      setIsEditing(true);
      startTyping(card.id);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    startTyping(card.id);
  };

  const handleSaveWithTyping = () => {
    handleSaveEdit();
    stopTyping(card.id);
  };

  const handleCancelWithTyping = () => {
    handleCancelEdit();
    stopTyping(card.id);
  };

  return (
    <div
      draggable={canDrag}
      onDragStart={() => onDragStart && onDragStart(card)}
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
          onDrop(card);
        }
      }}
      className={`rounded-lg shadow-md p-2.5 md:p-3 transition-all hover:shadow-lg active:scale-95 ${
        canDrag ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      } ${blurred ? 'blur-sm' : ''} ${hasVoted && isVoteStage ? 'ring-4 ring-purple-500 ring-offset-2' : ''} card-enter min-h-[100px] md:min-h-[120px]`}
      style={{
        backgroundColor: cardColor.bg,
        border: `2px solid ${hasVoted && isVoteStage ? '#9333ea' : cardColor.border}`,
        transform: `rotate(${(colorIndex % 3) - 1}deg)` // Slight random rotation
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: author?.color || '#999' }}
          >
            {author?.displayName[0].toUpperCase() || '?'}
          </div>
          {!blurred && (
            <span className="text-[10px] font-semibold" style={{ color: cardColor.text }}>
              {author?.displayName || 'Unknown'}
            </span>
          )}
        </div>

        {isOwnCard && !blurred && !isEditing && (
          <div className="flex gap-1.5 md:gap-1">
            <button
              onClick={handleStartEditing}
              className="hover:scale-110 transition-transform p-1 md:p-0"
              style={{ color: cardColor.text, opacity: 0.6 }}
              title="Edit card (or double-click)"
            >
              <svg className="w-4 h-4 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => deleteCard(card.id)}
              className="hover:scale-110 transition-transform p-1 md:p-0"
              style={{ color: cardColor.text, opacity: 0.6 }}
              title="Delete card"
            >
              <svg className="w-4 h-4 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <MarkdownEditor
          value={editContent}
          onChange={setEditContent}
          onSave={handleSaveWithTyping}
          onCancel={handleCancelWithTyping}
          placeholder="Enter card content..."
          textColor={cardColor.text}
          backgroundColor={cardColor.bg}
          borderColor={cardColor.border}
        />
      ) : (
        <>
          <div
            className={`text-sm font-medium leading-snug ${blurred ? 'select-none' : ''} ${isOwnCard ? 'cursor-pointer' : ''}`}
            style={{ color: cardColor.text }}
            onDoubleClick={handleDoubleClick}
            title={isOwnCard && !blurred ? 'Double-click to edit' : ''}
          >
            {blurred ? (
              '••••••••••'
            ) : (
              <MarkdownRenderer content={card.content} textColor={cardColor.text} />
            )}
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && !blurred && (
            <div className="mt-2 flex items-center gap-1 text-[10px] italic animate-pulse" style={{ color: cardColor.text, opacity: 0.7 }}>
              <svg className="w-3 h-3 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].displayName} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}
        </>
      )}

      {isVoteStage && votes !== undefined && (
        <div className="mt-2 flex items-center justify-between pt-2 border-t" style={{ borderColor: cardColor.border }}>
          <button
            onClick={onVote}
            className={`flex items-center gap-1 text-xs md:text-xs font-bold transition-all hover:scale-105 min-h-[36px] md:min-h-0 ${
              hasVoted ? 'bg-purple-600 text-white px-3 py-1.5 md:px-2 md:py-1 rounded-full' : 'px-2 py-1'
            }`}
            style={!hasVoted ? { color: cardColor.text } : {}}
          >
            {hasVoted ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="font-black">Voted #{userVoteNumber}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>Vote</span>
              </>
            )}
          </button>
          {session?.votesRevealed && votes > 0 && (
            <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{ color: cardColor.text, backgroundColor: cardColor.border + '40' }}>
              {votes} 👍
            </span>
          )}
        </div>
      )}
    </div>
  );
}
