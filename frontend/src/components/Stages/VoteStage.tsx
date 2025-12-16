'use client';

import Board from '../Board/Board';
import { useSession } from '../../context/SessionContext';

export default function VoteStage() {
  const { session, currentUser, getUserVoteCount, isHost, revealVotes } = useSession();

  if (!session || !currentUser) return null;

  const userVotes = getUserVoteCount(currentUser.id);
  const maxVotes = session.settings.votesPerUser;
  const remaining = maxVotes - userVotes;

  return (
    <div>
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            Vote 👍
          </h2>
          <div className="flex items-center gap-3">
            {isHost && !session.votesRevealed && (
              <button
                onClick={revealVotes}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Reveal Votes
              </button>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {remaining}
              </div>
              <div className="text-sm text-gray-600">
                vote{remaining !== 1 ? 's' : ''} remaining
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-700">
          Click the <strong>Vote</strong> button on cards or clusters that you think are most important.
          You have <strong>{maxVotes} total votes</strong>.
          {!session.votesRevealed && <span className="ml-1 font-semibold">Votes are private until revealed.</span>}
          {session.votesRevealed && <span className="ml-1 font-semibold text-green-600">Votes have been revealed!</span>}
        </p>
      </div>

      <Board canVote={true} />
    </div>
  );
}
