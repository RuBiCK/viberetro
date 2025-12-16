export enum SessionStage {
  SETUP = 'setup',
  ICE_BREAKER = 'ice_breaker',
  REFLECT = 'reflect',
  GROUP = 'group',
  VOTE = 'vote',
  ACT = 'act',
  COMPLETE = 'complete'
}

export enum TemplateType {
  START_STOP_CONTINUE = 'start_stop_continue',
  WENT_WELL_IMPROVE = 'went_well_improve',
  FOUR_LS = 'four_ls',
  MAD_SAD_GLAD = 'mad_sad_glad'
}

export interface SessionSettings {
  template: TemplateType;
  columns: string[];
  timerDuration: number;
  votesPerUser: number;
  allowAnonymous: boolean;
  iceBreaker: string;
}

export interface Session {
  id: string;
  hostId: string;
  name: string;
  stage: SessionStage;
  settings: SessionSettings;
  timerEndAt: number | null;
  iceBreakersRevealed: boolean;
  votesRevealed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  sessionId: string;
  displayName: string;
  isHost: boolean;
  color: string;
  cursorPosition: { x: number; y: number } | null;
  joinedAt: number;
}

export interface Card {
  id: string;
  sessionId: string;
  userId: string;
  column: string;
  content: string;
  position: { x: number; y: number };
  clusterId: string | null;
  isRevealed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Cluster {
  id: string;
  sessionId: string;
  name: string;
  cardIds: string[];
  column: string;
  position: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface Vote {
  id: string;
  sessionId: string;
  userId: string;
  targetId: string;
  targetType: 'card' | 'cluster';
  createdAt: number;
}

export interface ActionItem {
  id: string;
  sessionId: string;
  owner: string;
  task: string;
  createdAt: number;
}

export interface IceBreaker {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: 'gif' | 'drawing' | 'text';
  createdAt: number;
}

export interface SocketEvents {
  'join:session': (data: { sessionId: string; displayName: string }) => void;
  'cursor:move': (data: { x: number; y: number }) => void;
  'card:create': (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  'card:update': (data: { id: string; updates: Partial<Card> }) => void;
  'card:delete': (data: { id: string }) => void;
  'cluster:create': (data: { sourceCardId: string; targetCardId: string }) => void;
  'cluster:ungroup': (data: { clusterId: string }) => void;
  'vote:cast': (data: { targetId: string; targetType: 'card' | 'cluster' }) => void;
  'vote:remove': (data: { voteId: string }) => void;
  'action:create': (data: Omit<ActionItem, 'id' | 'createdAt'>) => void;
  'action:update': (data: { id: string; updates: Partial<ActionItem> }) => void;
  'action:delete': (data: { id: string }) => void;
  'icebreaker:create': (data: Omit<IceBreaker, 'id' | 'createdAt'>) => void;
  'icebreaker:reveal': () => void;
  'vote:reveal': () => void;
  'stage:advance': () => void;
  'timer:start': (data: { duration: number }) => void;
  'session:export': () => void;

  'session:state': (data: {
    session: Session;
    users: User[];
    cards: Card[];
    clusters: Cluster[];
    votes: Vote[];
    actionItems: ActionItem[];
    iceBreakers: IceBreaker[];
  }) => void;
  'user:joined': (data: User) => void;
  'user:left': (data: { userId: string }) => void;
  'cursor:updated': (data: { userId: string; position: { x: number; y: number } }) => void;
  'card:created': (data: Card) => void;
  'card:updated': (data: Card) => void;
  'card:deleted': (data: { id: string }) => void;
  'cluster:created': (data: Cluster) => void;
  'cluster:updated': (data: Cluster) => void;
  'cluster:deleted': (data: { id: string }) => void;
  'vote:added': (data: Vote) => void;
  'vote:removed': (data: { voteId: string }) => void;
  'action:created': (data: ActionItem) => void;
  'action:updated': (data: ActionItem) => void;
  'action:deleted': (data: { id: string }) => void;
  'icebreaker:created': (data: IceBreaker) => void;
  'icebreaker:revealed': (data: { iceBreakersRevealed: boolean }) => void;
  'vote:revealed': (data: { votesRevealed: boolean }) => void;
  'stage:changed': (data: { stage: SessionStage }) => void;
  'timer:tick': (data: { remainingSeconds: number }) => void;
  'session:exported': (data: { markdown: string }) => void;
  'error': (data: { message: string }) => void;
}

export const TEMPLATES: Record<TemplateType, { name: string; columns: string[] }> = {
  [TemplateType.START_STOP_CONTINUE]: {
    name: 'Start, Stop, Continue',
    columns: ['Start', 'Stop', 'Continue']
  },
  [TemplateType.WENT_WELL_IMPROVE]: {
    name: 'Went Well, To Improve',
    columns: ['Went Well', 'To Improve']
  },
  [TemplateType.FOUR_LS]: {
    name: 'Four Ls',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed For']
  },
  [TemplateType.MAD_SAD_GLAD]: {
    name: 'Mad, Sad, Glad',
    columns: ['Mad', 'Sad', 'Glad']
  }
};
