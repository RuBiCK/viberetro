'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSocket } from '../lib/socket';
import {
  Session,
  User,
  Card,
  Cluster,
  Vote,
  ActionItem,
  IceBreaker,
  SessionStage
} from '../types';
import { Socket } from 'socket.io-client';

interface SessionContextType {
  socket: Socket | null;
  session: Session | null;
  users: User[];
  cards: Card[];
  clusters: Cluster[];
  votes: Vote[];
  actionItems: ActionItem[];
  iceBreakers: IceBreaker[];
  currentUser: User | null;
  isHost: boolean;
  connected: boolean;
  error: string | null;
  leftUsers: string[];

  // Actions
  joinSession: (sessionId: string, displayName: string) => void;
  moveCursor: (x: number, y: number) => void;
  createCard: (data: Omit<Card, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  mergeCards: (sourceId: string, targetId: string) => void;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  ungroupCluster: (clusterId: string) => void;
  castVote: (targetId: string, targetType: 'card' | 'cluster') => void;
  removeVote: (voteId: string) => void;
  createActionItem: (owner: string, task: string) => void;
  updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (id: string) => void;
  createIceBreaker: (content: string, type: 'gif' | 'drawing' | 'text') => void;
  revealIceBreakers: () => void;
  revealVotes: () => void;
  advanceStage: () => void;
  previousStage: () => void;
  startTimer: (duration: number) => void;
  exportSession: () => void;
  getUserVoteCount: (userId: string) => number;
  getTargetVotes: (targetId: string) => Vote[];
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [iceBreakers, setIceBreakers] = useState<IceBreaker[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftUsers, setLeftUsers] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('❌ Backend error:', data.message);
      setError(data.message);
    });

    newSocket.on('session:state', (data) => {
      setSession(data.session);
      setUsers(data.users);
      setCards(data.cards);
      setClusters(data.clusters);
      setVotes(data.votes);
      setActionItems(data.actionItems);
      setIceBreakers(data.iceBreakers);
    });

    newSocket.on('user:joined', (user: User) => {
      setUsers(prev => [...prev, user]);
    });

    newSocket.on('user:left', (data: { userId: string }) => {
      const leavingUser = users.find(u => u.id === data.userId);
      if (leavingUser) {
        console.log('👋 User left:', leavingUser.displayName);
        setLeftUsers(prev => [...prev, leavingUser.displayName]);
        // Remove notification after 5 seconds
        setTimeout(() => {
          setLeftUsers(prev => prev.filter(name => name !== leavingUser.displayName));
        }, 5000);
      }
      setUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    newSocket.on('cursor:updated', (data: { userId: string; position: { x: number; y: number } }) => {
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, cursorPosition: data.position } : u
      ));
    });

    newSocket.on('card:created', (card: Card) => {
      setCards(prev => [...prev, card]);
    });

    newSocket.on('card:updated', (card: Card) => {
      console.log('📥 Received card:updated:', { id: card.id, clusterId: card.clusterId });
      setCards(prev => prev.map(c => c.id === card.id ? card : c));
    });

    newSocket.on('card:deleted', (data: { id: string }) => {
      setCards(prev => prev.filter(c => c.id !== data.id));
    });

    newSocket.on('cluster:created', (cluster: Cluster) => {
      console.log('📥 Received cluster:created:', cluster);
      setClusters(prev => {
        // Check if cluster already exists (in case of update)
        const existingIndex = prev.findIndex(cl => cl.id === cluster.id);
        if (existingIndex !== -1) {
          // Update existing cluster
          const updated = [...prev];
          updated[existingIndex] = cluster;
          return updated;
        }
        // Add new cluster
        return [...prev, cluster];
      });
    });

    newSocket.on('cluster:updated', (cluster: Cluster) => {
      console.log('📥 Received cluster:updated:', cluster);
      setClusters(prev => prev.map(cl => cl.id === cluster.id ? cluster : cl));
    });

    newSocket.on('cluster:deleted', (data: { id: string }) => {
      console.log('🗑️  Received cluster:deleted:', data.id);
      setClusters(prev => {
        const filtered = prev.filter(cl => cl.id !== data.id);
        console.log('Clusters after deletion:', filtered.length, 'remaining');
        return filtered;
      });
    });

    newSocket.on('vote:added', (vote: Vote) => {
      setVotes(prev => [...prev, vote]);
    });

    newSocket.on('vote:removed', (data: { voteId: string }) => {
      setVotes(prev => prev.filter(v => v.id !== data.voteId));
    });

    newSocket.on('action:created', (actionItem: ActionItem) => {
      setActionItems(prev => [...prev, actionItem]);
    });

    newSocket.on('action:updated', (actionItem: ActionItem) => {
      setActionItems(prev => prev.map(a => a.id === actionItem.id ? actionItem : a));
    });

    newSocket.on('action:deleted', (data: { id: string }) => {
      setActionItems(prev => prev.filter(a => a.id !== data.id));
    });

    newSocket.on('icebreaker:created', (iceBreaker: IceBreaker) => {
      setIceBreakers(prev => [...prev, iceBreaker]);
    });

    newSocket.on('icebreaker:revealed', (data: { iceBreakersRevealed: boolean }) => {
      setSession(prev => prev ? { ...prev, iceBreakersRevealed: data.iceBreakersRevealed } : null);
    });

    newSocket.on('vote:revealed', (data: { votesRevealed: boolean }) => {
      setSession(prev => prev ? { ...prev, votesRevealed: data.votesRevealed } : null);
    });

    newSocket.on('stage:changed', (data: { stage: SessionStage }) => {
      setSession(prev => prev ? { ...prev, stage: data.stage } : null);
    });

    newSocket.on('timer:tick', (data: { remainingSeconds: number }) => {
      // Handle timer updates in UI
      console.log('Timer:', data.remainingSeconds);
    });

    newSocket.on('session:exported', (data: { markdown: string }) => {
      // Trigger download
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retro-${session?.id}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('error');
      newSocket.off('session:state');
      newSocket.off('user:joined');
      newSocket.off('user:left');
      newSocket.off('cursor:updated');
      newSocket.off('card:created');
      newSocket.off('card:updated');
      newSocket.off('card:deleted');
      newSocket.off('cluster:created');
      newSocket.off('cluster:updated');
      newSocket.off('cluster:deleted');
      newSocket.off('vote:added');
      newSocket.off('vote:removed');
      newSocket.off('action:created');
      newSocket.off('action:updated');
      newSocket.off('action:deleted');
      newSocket.off('icebreaker:created');
      newSocket.off('icebreaker:revealed');
      newSocket.off('vote:revealed');
      newSocket.off('stage:changed');
      newSocket.off('timer:tick');
      newSocket.off('session:exported');
    };
  }, []);

  const joinSession = useCallback((sessionId: string, displayName: string) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    // Check if user is the host
    const hostId = typeof window !== 'undefined' ? localStorage.getItem(`host_${sessionId}`) : null;

    // Check if we have an existing user ID for this session
    const userId = typeof window !== 'undefined' ? localStorage.getItem(`user_${sessionId}`) : null;

    console.log('Joining session...', { sessionId, displayName, hostId, userId, socketId: socket.id });

    // If already connected, join immediately
    if (socket.connected) {
      console.log('Socket already connected, emitting join:session');
      socket.emit('join:session', { sessionId, displayName, hostId, userId });
    } else {
      // Connect and join when connected
      console.log('Connecting socket...');
      socket.connect();

      socket.once('connect', () => {
        console.log('Socket connected, emitting join:session');
        socket.emit('join:session', { sessionId, displayName, hostId, userId });
      });
    }

    // Set current user after receiving session state
    socket.once('session:state', (data) => {
      console.log('Received session:state', data);
      const user = data.users.find((u: User) => u.displayName === displayName || (userId && u.id === userId));
      if (user) {
        console.log('Setting current user:', user);
        setCurrentUser(user);
        // Store user ID in localStorage for reconnection
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_${sessionId}`, user.id);
        }
      }
    });
  }, [socket]);

  const moveCursor = useCallback((x: number, y: number) => {
    socket?.emit('cursor:move', { x, y });
  }, [socket]);

  const createCard = useCallback((data: Omit<Card, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>) => {
    socket?.emit('card:create', data);
  }, [socket]);

  const updateCard = useCallback((id: string, updates: Partial<Card>) => {
    socket?.emit('card:update', { id, updates });
  }, [socket]);

  const deleteCard = useCallback((id: string) => {
    socket?.emit('card:delete', { id });
  }, [socket]);

  const mergeCards = useCallback((sourceCardId: string, targetCardId: string) => {
    console.log('📤 Emitting cluster:create event:', { sourceCardId, targetCardId, socketConnected: socket?.connected });
    if (!socket || !socket.connected) {
      console.error('❌ Socket not connected!');
      return;
    }
    socket.emit('cluster:create', { sourceCardId, targetCardId });
    console.log('✅ cluster:create event emitted');
  }, [socket]);

  const updateCluster = useCallback((id: string, updates: Partial<Cluster>) => {
    console.log('📤 Emitting cluster:update:', { id, updates, socketConnected: socket?.connected });
    socket?.emit('cluster:update', { id, updates });
  }, [socket]);

  const ungroupCluster = useCallback((clusterId: string) => {
    socket?.emit('cluster:ungroup', { clusterId });
  }, [socket]);

  const castVote = useCallback((targetId: string, targetType: 'card' | 'cluster') => {
    socket?.emit('vote:cast', { targetId, targetType });
  }, [socket]);

  const removeVote = useCallback((voteId: string) => {
    socket?.emit('vote:remove', { voteId });
  }, [socket]);

  const createActionItem = useCallback((owner: string, task: string) => {
    socket?.emit('action:create', { owner, task });
  }, [socket]);

  const updateActionItem = useCallback((id: string, updates: Partial<ActionItem>) => {
    socket?.emit('action:update', { id, updates });
  }, [socket]);

  const deleteActionItem = useCallback((id: string) => {
    socket?.emit('action:delete', { id });
  }, [socket]);

  const createIceBreaker = useCallback((content: string, type: 'gif' | 'drawing' | 'text') => {
    socket?.emit('icebreaker:create', { content, type });
  }, [socket]);

  const revealIceBreakers = useCallback(() => {
    socket?.emit('icebreaker:reveal');
  }, [socket]);

  const revealVotes = useCallback(() => {
    socket?.emit('vote:reveal');
  }, [socket]);

  const advanceStage = useCallback(() => {
    console.log('advanceStage called, socket connected:', socket?.connected);
    console.log('currentUser:', currentUser);
    console.log('isHost:', currentUser?.isHost);
    if (!socket || !socket.connected) {
      console.error('Socket not connected!');
      setError('Connection lost. Please refresh the page.');
      return;
    }
    socket.emit('stage:advance');
    console.log('stage:advance event emitted');
  }, [socket, currentUser]);

  const previousStage = useCallback(() => {
    console.log('previousStage called, socket connected:', socket?.connected);
    if (!socket || !socket.connected) {
      console.error('Socket not connected!');
      setError('Connection lost. Please refresh the page.');
      return;
    }
    socket.emit('stage:previous');
    console.log('stage:previous event emitted');
  }, [socket]);

  const startTimer = useCallback((duration: number) => {
    socket?.emit('timer:start', { duration });
  }, [socket]);

  const exportSession = useCallback(() => {
    socket?.emit('session:export');
  }, [socket]);

  const getUserVoteCount = useCallback((userId: string) => {
    return votes.filter(v => v.userId === userId).length;
  }, [votes]);

  const getTargetVotes = useCallback((targetId: string) => {
    return votes.filter(v => v.targetId === targetId);
  }, [votes]);

  const isHost = currentUser?.isHost || false;

  return (
    <SessionContext.Provider
      value={{
        socket,
        session,
        users,
        cards,
        clusters,
        votes,
        actionItems,
        iceBreakers,
        currentUser,
        isHost,
        connected,
        error,
        leftUsers,
        joinSession,
        moveCursor,
        createCard,
        updateCard,
        deleteCard,
        mergeCards,
        updateCluster,
        ungroupCluster,
        castVote,
        removeVote,
        createActionItem,
        updateActionItem,
        deleteActionItem,
        createIceBreaker,
        revealIceBreakers,
        revealVotes,
        advanceStage,
        previousStage,
        startTimer,
        exportSession,
        getUserVoteCount,
        getTargetVotes
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
