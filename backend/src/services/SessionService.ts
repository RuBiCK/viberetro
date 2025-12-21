import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStage, SessionSettings, SessionStatus, User } from '../../../shared/types';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import { CardModel } from '../models/Card';
import { VoteModel } from '../models/Vote';
import { SessionParticipantModel } from '../models/SessionParticipant';
import { ClusterModel } from '../models/Cluster';
import { ActionItemModel } from '../models/ActionItem';
import { IceBreakerModel } from '../models/IceBreaker';

export class SessionService {
  static createSession(hostId: string, name: string, settings: SessionSettings): Session {
    const session: Session = {
      id: uuidv4(),
      hostId,
      name,
      stage: SessionStage.SETUP,
      status: SessionStatus.ACTIVE,
      settings,
      timerEndAt: null,
      iceBreakersRevealed: false,
      votesRevealed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return SessionModel.create(session);
  }

  static getSession(sessionId: string): Session | null {
    return SessionModel.findById(sessionId);
  }

  static advanceStage(sessionId: string, hostId: string): SessionStage {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.hostId !== hostId) throw new Error('Only host can advance stage');

    const stages = [
      SessionStage.SETUP,
      SessionStage.ICE_BREAKER,
      SessionStage.REFLECT,
      SessionStage.GROUP,
      SessionStage.VOTE,
      SessionStage.ACT,
      SessionStage.COMPLETE
    ];

    const currentIndex = stages.indexOf(session.stage);
    const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];

    // Auto-reveal cards when entering GROUP stage
    if (nextStage === SessionStage.GROUP) {
      CardModel.revealAll(sessionId);
    }

    // Clear votes and reset votesRevealed when entering VOTE stage
    if (nextStage === SessionStage.VOTE) {
      VoteModel.deleteBySessionId(sessionId);
      SessionModel.update(sessionId, { stage: nextStage, votesRevealed: false });
      return nextStage;
    }

    // Mark session as completed when advancing to COMPLETE stage
    if (nextStage === SessionStage.COMPLETE) {
      SessionModel.update(sessionId, {
        stage: nextStage,
        status: SessionStatus.COMPLETED,
        completedAt: Date.now()
      });
      return nextStage;
    }

    SessionModel.update(sessionId, { stage: nextStage });
    return nextStage;
  }

  static previousStage(sessionId: string, hostId: string): SessionStage {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.hostId !== hostId) throw new Error('Only host can change stage');

    const stages = [
      SessionStage.SETUP,
      SessionStage.ICE_BREAKER,
      SessionStage.REFLECT,
      SessionStage.GROUP,
      SessionStage.VOTE,
      SessionStage.ACT,
      SessionStage.COMPLETE
    ];

    const currentIndex = stages.indexOf(session.stage);
    const previousStage = stages[Math.max(currentIndex - 1, 0)];

    // Clear votes and reset votesRevealed when going back to VOTE stage
    if (previousStage === SessionStage.VOTE) {
      VoteModel.deleteBySessionId(sessionId);
      SessionModel.update(sessionId, { stage: previousStage, votesRevealed: false });
      return previousStage;
    }

    SessionModel.update(sessionId, { stage: previousStage });
    return previousStage;
  }

  static startTimer(sessionId: string, hostId: string, duration: number): number {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.hostId !== hostId) throw new Error('Only host can start timer');

    const timerEndAt = Date.now() + duration * 1000;
    SessionModel.update(sessionId, { timerEndAt });
    return timerEndAt;
  }

  static cleanupOldSessions(): number {
    // Only delete sessions that are ACTIVE and old
    // Keep COMPLETED and ARCHIVED sessions for history
    const maxAge = parseInt(process.env.MAX_SESSION_AGE || '86400000');
    const cutoffTime = Date.now() - maxAge;

    // Get all old active sessions and delete them
    const allSessions = SessionModel.getAll();
    let deletedCount = 0;

    for (const session of allSessions) {
      if (session.status === SessionStatus.ACTIVE && session.createdAt < cutoffTime) {
        SessionModel.delete(session.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  static getSessionState(sessionId: string) {
    const session = SessionModel.findById(sessionId);
    if (!session) return null;

    const users = UserModel.findBySessionId(sessionId);
    const cards = CardModel.findBySessionId(sessionId);
    const clusters = ClusterModel.findBySessionId(sessionId);
    const votes = VoteModel.findBySessionId(sessionId);
    const actionItems = ActionItemModel.findBySessionId(sessionId);
    const iceBreakers = IceBreakerModel.findBySessionId(sessionId);

    return {
      session,
      users,
      cards,
      clusters,
      votes,
      actionItems,
      iceBreakers
    };
  }

  static archiveSession(sessionId: string, hostId: string): void {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.hostId !== hostId) throw new Error('Only host can archive session');

    SessionModel.update(sessionId, {
      status: SessionStatus.ARCHIVED,
      completedAt: session.completedAt || Date.now()
    });
  }

  static joinSession(sessionId: string, displayName: string, hostId?: string, userId?: string): { user: User; session: Session } {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');

    // Check if reconnecting with existing userId
    if (userId) {
      const existingUser = UserModel.findById(userId);
      if (existingUser && existingUser.sessionId === sessionId) {
        console.log('Reconnecting existing user:', existingUser.displayName);
        return { user: existingUser, session };
      }
    }

    // Check if this user is the host
    const isHost = hostId !== undefined && hostId === session.hostId;

    const user: User = {
      id: uuidv4(),
      sessionId,
      displayName,
      isHost,
      color: this.generateRandomColor(),
      cursorPosition: null,
      joinedAt: Date.now()
    };

    UserModel.create(user);

    // Track participant for session history
    SessionParticipantModel.add({
      sessionId,
      userId: user.id,
      userDisplayName: displayName,
      joinedAt: Date.now()
    });

    return { user, session };
  }

  static getSessionUsers(sessionId: string): User[] {
    return UserModel.findBySessionId(sessionId);
  }

  private static generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B500', '#FF69B4', '#20B2AA', '#FF7F50'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
