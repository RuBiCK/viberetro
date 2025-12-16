import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStage, SessionSettings, User } from '../../../shared/types';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import { CardModel } from '../models/Card';

export class SessionService {
  static createSession(hostId: string, name: string, settings: SessionSettings): Session {
    const session: Session = {
      id: uuidv4(),
      hostId,
      name,
      stage: SessionStage.SETUP,
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
    const maxAge = parseInt(process.env.MAX_SESSION_AGE || '86400000');
    const cutoffTime = Date.now() - maxAge;
    return SessionModel.deleteOlderThan(cutoffTime);
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
