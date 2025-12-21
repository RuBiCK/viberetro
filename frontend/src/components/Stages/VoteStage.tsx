'use client';

import Board from '../Board/Board';
import { useSession } from '../../context/SessionContext';

export default function VoteStage() {
  const { session, currentUser, getUserVoteCount, isHost, revealVotes, votes, users } = useSession();

  if (!session || !currentUser) return null;

  const userVotes = getUserVoteCount(currentUser.id);
  const maxVotes = session.settings.votesPerUser;
  const remaining = maxVotes - userVotes;

  // Calculate session-wide statistics
  const totalVotesCast = votes.length;
  const totalPossibleVotes = users.length * maxVotes;
  const totalRemainingVotes = totalPossibleVotes - totalVotesCast;

  return (
    <div>
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 shadow-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Vote 👍
            </h2>
            <p className="text-gray-700 text-sm">
              Click items to vote or remove your vote.
              {!session.votesRevealed && <span className="ml-1 font-semibold text-purple-600">Votes are private until revealed.</span>}
              {session.votesRevealed && <span className="ml-1 font-semibold text-green-600">Votes have been revealed!</span>}
            </p>
          </div>

          {isHost && !session.votesRevealed && (
            <button
              onClick={revealVotes}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold transition-all text-sm shadow-md hover:scale-105"
            >
              Reveal Votes
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* User Stats */}
          <div className="bg-white rounded-lg p-4 border-2 border-purple-300 shadow-sm">
            <div className="text-xs font-semibold text-purple-600 mb-2">YOUR VOTES</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-purple-600">{userVotes}</div>
              <div className="text-lg text-gray-600">/ {maxVotes}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {remaining} remaining
            </div>
          </div>

          {/* Session Stats */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
            <div className="text-xs font-semibold text-blue-600 mb-2">SESSION TOTAL</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-blue-600">{totalVotesCast}</div>
              <div className="text-lg text-gray-600">/ {totalPossibleVotes}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {totalRemainingVotes} remaining across {users.length} users
            </div>
          </div>
        </div>
      </div>

      <Board canVote={true} isVoteStage={true} canAddCards={false} />
    </div>
  );
}
