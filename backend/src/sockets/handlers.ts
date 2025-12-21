import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { SessionService } from '../services/SessionService';
import { ClusterService } from '../services/ClusterService';
import { ExportService } from '../services/ExportService';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import { CardModel } from '../models/Card';
import { ClusterModel } from '../models/Cluster';
import { VoteModel } from '../models/Vote';
import { ActionItemModel } from '../models/ActionItem';
import { IceBreakerModel } from '../models/IceBreaker';
import { Card, Cluster, Vote, ActionItem, IceBreaker, SessionStage } from '../../../shared/types';

interface SocketData {
  userId?: string;
  sessionId?: string;
  lastTypingEvent?: number;
}

export function setupSocketHandlers(io: Server) {
  console.log('Setting up socket handlers...');

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    const socketData = socket.data as SocketData;

    console.log('Registering event handlers for socket:', socket.id);

    // Join session
    socket.on('join:session', async (data: { sessionId: string; displayName: string; hostId?: string | null; userId?: string }) => {
      console.log('join:session event received:', data);
      try {
        const isReconnecting = !!data.userId;
        const { user, session } = SessionService.joinSession(
          data.sessionId,
          data.displayName,
          data.hostId || undefined,
          data.userId
        );
        console.log('User joined:', user.displayName, 'isHost:', user.isHost, 'reconnecting:', isReconnecting);

        socketData.userId = user.id;
        socketData.sessionId = data.sessionId;

        // Join socket room
        socket.join(data.sessionId);

        // Send full session state to the joining user
        const users = UserModel.findBySessionId(data.sessionId);
        const cards = CardModel.findBySessionId(data.sessionId);
        const clusters = ClusterModel.findBySessionId(data.sessionId);
        const votes = VoteModel.findBySessionId(data.sessionId);
        const actionItems = ActionItemModel.findBySessionId(data.sessionId);
        const iceBreakers = IceBreakerModel.findBySessionId(data.sessionId);

        socket.emit('session:state', {
          session,
          users,
          cards,
          clusters,
          votes,
          actionItems,
          iceBreakers
        });

        // Notify others - either new user or reconnection
        if (isReconnecting) {
          socket.to(data.sessionId).emit('user:reconnected', { userId: user.id });
        } else {
          socket.to(data.sessionId).emit('user:joined', user);
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Cursor movement
    socket.on('cursor:move', (data: { x: number; y: number }) => {
      if (!socketData.userId || !socketData.sessionId) return;

      UserModel.update(socketData.userId, { cursorPosition: data });
      socket.to(socketData.sessionId).emit('cursor:updated', {
        userId: socketData.userId,
        position: data
      });
    });

    // Card operations
    socket.on('card:create', (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!socketData.sessionId) return;

      try {
        const card: Card = {
          id: uuidv4(),
          ...data,
          sessionId: socketData.sessionId,
          isRevealed: false, // Always create cards as blurred
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        CardModel.create(card);
        io.to(socketData.sessionId).emit('card:created', card);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('card:update', (data: { id: string; updates: Partial<Card> }) => {
      if (!socketData.sessionId) return;

      try {
        CardModel.update(data.id, data.updates);
        const updatedCard = CardModel.findById(data.id);
        if (updatedCard) {
          io.to(socketData.sessionId).emit('card:updated', updatedCard);
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('card:delete', (data: { id: string }) => {
      if (!socketData.sessionId) return;

      try {
        CardModel.delete(data.id);
        io.to(socketData.sessionId).emit('card:deleted', { id: data.id });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Cluster operations
    socket.on('cluster:create', (data: { sourceCardId: string; targetCardId: string }) => {
      console.log('🔵 cluster:create event received:', data);
      console.log('socketData:', socketData);

      if (!socketData.sessionId) {
        console.error('❌ No sessionId in socketData!');
        return;
      }

      try {
        console.log('📝 Calling ClusterService.mergeCards...');
        const result = ClusterService.mergeCards(data.sourceCardId, data.targetCardId);
        console.log('✅ Cluster created:', result.cluster.id);

        // Emit deleted clusters first (if any)
        if (result.deletedClusterIds.length > 0 && socketData.sessionId) {
          console.log('🗑️  Emitting cluster deletions:', result.deletedClusterIds);
          result.deletedClusterIds.forEach(deletedId => {
            io.to(socketData.sessionId!).emit('cluster:deleted', { id: deletedId });
          });
        }

        // Send updated/created cluster
        console.log('📤 Emitting cluster:created to room:', socketData.sessionId);
        io.to(socketData.sessionId!).emit('cluster:created', result.cluster);

        // Send updated cards
        if (socketData.sessionId) {
          console.log('📤 Fetching and emitting updated cards. Count:', result.updatedCardIds.length);
          console.log('📤 Card IDs to emit:', result.updatedCardIds);
          result.updatedCardIds.forEach(cardId => {
            const card = CardModel.findById(cardId);
            if (card) {
              console.log('📤 Emitting card:updated for card:', cardId, 'column:', card.column);
              io.to(socketData.sessionId!).emit('card:updated', card);
            }
          });
        }
        console.log('✅ All events emitted successfully');
      } catch (error: any) {
        console.error('❌ Error creating cluster:', error.message);
        console.error('Stack trace:', error.stack);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('cluster:update', (data: { id: string; updates: Partial<Cluster> }) => {
      if (!socketData.sessionId) return;

      try {
        console.log('🔄 cluster:update received:', { clusterId: data.id, updates: data.updates });

        // Get cluster before update
        const beforeUpdate = ClusterModel.findById(data.id);
        console.log('📊 Cluster BEFORE update:', { id: beforeUpdate?.id, column: beforeUpdate?.column });

        ClusterModel.update(data.id, data.updates);

        // Get cluster after update
        const updatedCluster = ClusterModel.findById(data.id);
        console.log('📊 Cluster AFTER update:', { id: updatedCluster?.id, column: updatedCluster?.column });

        if (updatedCluster) {
          console.log('📤 Emitting cluster:updated:', updatedCluster);
          io.to(socketData.sessionId).emit('cluster:updated', updatedCluster);
        }
      } catch (error: any) {
        console.error('❌ Error updating cluster:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('cluster:ungroup', (data: { clusterId: string }) => {
      if (!socketData.sessionId) return;

      try {
        const cluster = ClusterModel.findById(data.clusterId);
        if (!cluster) return;

        const cardIds = cluster.cardIds;
        ClusterService.ungroupCluster(data.clusterId);

        io.to(socketData.sessionId).emit('cluster:deleted', { id: data.clusterId });

        // Send updated cards
        if (socketData.sessionId) {
          cardIds.forEach(cardId => {
            const card = CardModel.findById(cardId);
            if (card) {
              io.to(socketData.sessionId!).emit('card:updated', card);
            }
          });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Vote operations
    socket.on('vote:cast', (data: { targetId: string; targetType: 'card' | 'cluster' }) => {
      if (!socketData.userId || !socketData.sessionId) return;

      try {
        const session = SessionModel.findById(socketData.sessionId);
        if (!session || session.stage !== SessionStage.VOTE) {
          socket.emit('error', { message: 'Voting not allowed in current stage' });
          return;
        }

        // Check if user has votes remaining
        const userVotes = VoteModel.findByUserId(socketData.userId);
        if (userVotes.length >= session.settings.votesPerUser) {
          socket.emit('error', { message: 'No votes remaining' });
          return;
        }

        const vote: Vote = {
          id: uuidv4(),
          sessionId: socketData.sessionId,
          userId: socketData.userId,
          targetId: data.targetId,
          targetType: data.targetType,
          createdAt: Date.now()
        };

        VoteModel.create(vote);
        io.to(socketData.sessionId).emit('vote:added', vote);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('vote:remove', (data: { voteId: string }) => {
      if (!socketData.sessionId) return;

      try {
        VoteModel.delete(data.voteId);
        io.to(socketData.sessionId).emit('vote:removed', { voteId: data.voteId });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Action item operations
    socket.on('action:create', (data: Omit<ActionItem, 'id' | 'createdAt'>) => {
      if (!socketData.sessionId) return;

      try {
        const actionItem: ActionItem = {
          id: uuidv4(),
          ...data,
          sessionId: socketData.sessionId,
          createdAt: Date.now()
        };

        ActionItemModel.create(actionItem);
        io.to(socketData.sessionId).emit('action:created', actionItem);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('action:update', (data: { id: string; updates: Partial<ActionItem> }) => {
      if (!socketData.sessionId) return;

      try {
        ActionItemModel.update(data.id, data.updates);
        const updated = ActionItemModel.findById(data.id);
        if (updated) {
          io.to(socketData.sessionId).emit('action:updated', updated);
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('action:delete', (data: { id: string }) => {
      if (!socketData.sessionId) return;

      try {
        ActionItemModel.delete(data.id);
        io.to(socketData.sessionId).emit('action:deleted', { id: data.id });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Ice breaker
    socket.on('icebreaker:create', (data: Omit<IceBreaker, 'id' | 'createdAt'>) => {
      if (!socketData.userId || !socketData.sessionId) return;

      try {
        const iceBreaker: IceBreaker = {
          id: uuidv4(),
          ...data,
          userId: socketData.userId,
          sessionId: socketData.sessionId,
          createdAt: Date.now()
        };

        IceBreakerModel.create(iceBreaker);
        io.to(socketData.sessionId).emit('icebreaker:created', iceBreaker);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('icebreaker:reveal', () => {
      if (!socketData.sessionId) return;

      try {
        SessionModel.update(socketData.sessionId, { iceBreakersRevealed: true });
        const session = SessionModel.findById(socketData.sessionId);
        if (session) {
          io.to(socketData.sessionId).emit('icebreaker:revealed', { iceBreakersRevealed: true });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('vote:reveal', () => {
      if (!socketData.sessionId) return;

      try {
        SessionModel.update(socketData.sessionId, { votesRevealed: true });
        const session = SessionModel.findById(socketData.sessionId);
        if (session) {
          io.to(socketData.sessionId).emit('vote:revealed', { votesRevealed: true });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Stage management (host only)
    socket.on('stage:advance', () => {
      console.log('stage:advance event received!');
      console.log('socketData:', socketData);

      if (!socketData.userId || !socketData.sessionId) {
        console.error('stage:advance: Missing userId or sessionId!', {
          userId: socketData.userId,
          sessionId: socketData.sessionId
        });
        return;
      }

      try {
        // Verify user is host
        const user = UserModel.findById(socketData.userId);
        if (!user || !user.isHost) {
          socket.emit('error', { message: 'Only host can advance stage' });
          return;
        }

        console.log('Advancing stage for session:', socketData.sessionId);
        const session = SessionModel.findById(socketData.sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const nextStage = SessionService.advanceStage(socketData.sessionId, session.hostId);
        console.log('Stage advanced to:', nextStage);

        console.log('Emitting stage:changed to room:', socketData.sessionId);
        io.to(socketData.sessionId).emit('stage:changed', { stage: nextStage });

        // If entering GROUP stage, reveal all cards
        if (nextStage === SessionStage.GROUP && socketData.sessionId) {
          console.log('Revealing cards for GROUP stage');
          const cards = CardModel.findBySessionId(socketData.sessionId);
          const sessionId = socketData.sessionId;
          cards.forEach(card => {
            io.to(sessionId).emit('card:updated', card);
          });
        }

        // If entering VOTE stage, notify clients that votes were cleared
        if (nextStage === SessionStage.VOTE && socketData.sessionId) {
          console.log('Entering VOTE stage - votes cleared');
          io.to(socketData.sessionId).emit('vote:revealed', { votesRevealed: false });
          // Emit session state to ensure all clients are synced
          const updatedSession = SessionModel.findById(socketData.sessionId);
          if (updatedSession) {
            // Filter API token from broadcast
            const sessionForBroadcast = {
              ...updatedSession,
              shortcutApiToken: undefined
            };
            const state = {
              session: sessionForBroadcast,
              users: UserModel.findBySessionId(socketData.sessionId),
              cards: CardModel.findBySessionId(socketData.sessionId),
              clusters: ClusterModel.findBySessionId(socketData.sessionId),
              votes: [], // Empty votes array
              actionItems: ActionItemModel.findBySessionId(socketData.sessionId),
              iceBreakers: IceBreakerModel.findBySessionId(socketData.sessionId)
            };
            io.to(socketData.sessionId).emit('session:state', state);
          }
        }

        console.log('Stage advance completed successfully');
      } catch (error: any) {
        console.error('Error in stage:advance:', error);
        console.error('Error stack:', error.stack);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('stage:previous', () => {
      console.log('stage:previous event received!');
      console.log('socketData:', socketData);

      if (!socketData.userId || !socketData.sessionId) {
        console.error('stage:previous: Missing userId or sessionId!', {
          userId: socketData.userId,
          sessionId: socketData.sessionId
        });
        return;
      }

      try {
        // Verify user is host
        const user = UserModel.findById(socketData.userId);
        if (!user || !user.isHost) {
          socket.emit('error', { message: 'Only host can change stage' });
          return;
        }

        console.log('Going to previous stage for session:', socketData.sessionId);
        const session = SessionModel.findById(socketData.sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const previousStage = SessionService.previousStage(socketData.sessionId, session.hostId);
        console.log('Stage changed to:', previousStage);

        console.log('Emitting stage:changed to room:', socketData.sessionId);
        io.to(socketData.sessionId).emit('stage:changed', { stage: previousStage });

        // If going back to VOTE stage, notify clients that votes were cleared
        if (previousStage === SessionStage.VOTE && socketData.sessionId) {
          console.log('Returning to VOTE stage - votes cleared');
          io.to(socketData.sessionId).emit('vote:revealed', { votesRevealed: false });
          // Emit session state to ensure all clients are synced
          const updatedSession = SessionModel.findById(socketData.sessionId);
          if (updatedSession) {
            // Filter API token from broadcast
            const sessionForBroadcast = {
              ...updatedSession,
              shortcutApiToken: undefined
            };
            const state = {
              session: sessionForBroadcast,
              users: UserModel.findBySessionId(socketData.sessionId),
              cards: CardModel.findBySessionId(socketData.sessionId),
              clusters: ClusterModel.findBySessionId(socketData.sessionId),
              votes: [], // Empty votes array
              actionItems: ActionItemModel.findBySessionId(socketData.sessionId),
              iceBreakers: IceBreakerModel.findBySessionId(socketData.sessionId)
            };
            io.to(socketData.sessionId).emit('session:state', state);
          }
        }

        console.log('Stage change completed successfully');
      } catch (error: any) {
        console.error('Error in stage:previous:', error);
        console.error('Error stack:', error.stack);
        socket.emit('error', { message: error.message });
      }
    });

    // Timer
    socket.on('timer:start', (data: { duration: number }) => {
      if (!socketData.userId || !socketData.sessionId) return;

      try {
        // Verify user is host
        const user = UserModel.findById(socketData.userId);
        if (!user || !user.isHost) {
          socket.emit('error', { message: 'Only host can start timer' });
          return;
        }

        const session = SessionModel.findById(socketData.sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const timerEndAt = SessionService.startTimer(
          socketData.sessionId,
          session.hostId,
          data.duration
        );

        // Broadcast timer start
        io.to(socketData.sessionId).emit('timer:tick', {
          remainingSeconds: data.duration
        });

        // Start countdown
        startTimerCountdown(io, socketData.sessionId, timerEndAt);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Export
    socket.on('session:export', () => {
      if (!socketData.sessionId) return;

      try {
        const markdown = ExportService.exportSessionAsMarkdown(socketData.sessionId);
        socket.emit('session:exported', { markdown });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { cardId: string }) => {
      if (!socketData.userId || !socketData.sessionId) return;

      // Throttle typing events (max 1 per second per user)
      const now = Date.now();
      if (socketData.lastTypingEvent && now - socketData.lastTypingEvent < 1000) {
        return;
      }
      socketData.lastTypingEvent = now;

      socket.to(socketData.sessionId).emit('typing:broadcast', {
        userId: socketData.userId,
        cardId: data.cardId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data: { cardId: string }) => {
      if (!socketData.userId || !socketData.sessionId) return;

      socket.to(socketData.sessionId).emit('typing:broadcast', {
        userId: socketData.userId,
        cardId: data.cardId,
        isTyping: false
      });
    });

    // Session archive (host only)
    socket.on('session:archive', () => {
      if (!socketData.userId || !socketData.sessionId) return;

      try {
        // Verify user is host
        const user = UserModel.findById(socketData.userId);
        if (!user || !user.isHost) {
          socket.emit('error', { message: 'Only host can archive session' });
          return;
        }

        SessionService.archiveSession(socketData.sessionId, user.id);
        const session = SessionModel.findById(socketData.sessionId);

        if (session) {
          io.to(socketData.sessionId).emit('session:archived', {
            sessionId: session.id,
            status: session.status
          });
        }
      } catch (error: any) {
        console.error('Error archiving session:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socketData.userId && socketData.sessionId) {
        // Don't delete user on disconnect - allow reconnection
        // User will be cleaned up when session is deleted
        console.log('User disconnected (can reconnect):', socketData.userId);
        // Note: We don't emit 'user:left' anymore since the user might reconnect
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

function startTimerCountdown(io: Server, sessionId: string, endAt: number) {
  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000));

    io.to(sessionId).emit('timer:tick', { remainingSeconds: remaining });

    if (remaining <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}
