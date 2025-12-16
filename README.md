# Sprint Retrospective Tool

A real-time, zero-config collaborative Sprint Retrospective application built with simplicity in mind.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Data Model](#data-model)
- [Real-Time Communication](#real-time-communication)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

🚀 **Zero Configuration** - No login required, just create and share a link
⚡ **Real-Time Collaboration** - See changes instantly with Socket.io
🎯 **Multiple Templates** - Start/Stop/Continue, Went Well/To Improve, and more
🔄 **Guided Workflow** - Structured stages from Ice Breaker to Action Items
🎨 **Card Clustering** - Drag and drop cards to group similar themes
🗳️ **Voting System** - Democratic prioritization of items
📦 **SQLite Database** - No external database required
🐳 **Docker Ready** - One command deployment
📤 **Export** - Download results as Markdown

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, SQLite, TypeScript
- **Frontend**: Next.js 14, React, TailwindCSS, TypeScript
- **Infrastructure**: Docker, Docker Compose

## Quick Start

### Using Docker (Recommended)

1. **Clone and start**:
   ```bash
   docker-compose up -d
   ```

2. **Access the application**:
   - Open http://localhost:3000
   - Create a session and share the URL with your team

That's it! 🎉

### Local Development

#### Prerequisites
- Node.js 20+
- npm or yarn

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## How It Works

### The Retrospective Flow

1. **Setup**
   - Host selects a template and configures settings
   - Participants join via shared URL with display names

2. **Ice Breaker** 🎉
   - Warm up activity to get everyone comfortable
   - Share something fun or what made you smile

3. **Reflect** 🤔
   - Write cards anonymously
   - Cards are blurred to others to avoid bias
   - Be honest and constructive

4. **Group** 🎯
   - All cards are revealed
   - Drag cards onto each other to create clusters
   - Identify common themes

5. **Vote** 👍
   - Each person gets X votes (configurable)
   - Click to vote on the most important cards/clusters
   - Democratic prioritization

6. **Act** ✅
   - Create concrete action items
   - Assign owners to tasks
   - Export results for follow-up

## Templates

### Start, Stop, Continue
- **Start**: What should we start doing?
- **Stop**: What should we stop doing?
- **Continue**: What should we continue doing?

### Went Well, To Improve
- **Went Well**: What went well this sprint?
- **To Improve**: What could be improved?

### Four Ls
- **Liked**: What did you like?
- **Learned**: What did you learn?
- **Lacked**: What was lacking?
- **Longed For**: What did you long for?

### Mad, Sad, Glad
- **Mad**: What made you mad?
- **Sad**: What made you sad?
- **Glad**: What made you glad?

## Architecture Deep Dive

### System Overview

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Browser   │ ←─────────────────────────→ │   Backend   │
│  (Next.js)  │         Socket.IO          │  (Express)  │
└─────────────┘                             └─────────────┘
      │                                            │
      │                                            │
      ├─ React Context (Global State)             ├─ Socket Handlers
      ├─ Stage Components                         ├─ Services (Business Logic)
      ├─ Socket.IO Client                         ├─ Models (Data Access)
      └─ Local Storage (Persistence)              └─ SQLite Database
```

### Frontend Architecture

**State Management Pattern:**
- `SessionContext.tsx` acts as the single source of truth for session state
- Uses React Context API to provide global state to all components
- Socket.IO client integrated directly into the context
- State updates triggered by socket events automatically re-render components

**Key Design Decisions:**
1. **Optimistic UI Updates**: Not implemented - all updates wait for server confirmation
2. **Reconnection Strategy**: User ID stored in localStorage enables seamless reconnection
3. **Stage-Based Rendering**: Each stage is an isolated component with specific UI/UX
4. **Real-Time Cursors**: Cursor positions tracked and broadcast for collaborative feel

**Component Hierarchy:**
```
SessionProvider (Context)
  └── SessionPage
       ├── StageIndicator (Shows current stage)
       ├── SetupStage (Waiting room)
       ├── IceBreakerStage (Ice breaker activity)
       ├── ReflectStage (Anonymous card creation)
       ├── GroupStage (Drag-and-drop clustering)
       ├── VoteStage (Dot voting)
       └── ActStage (Action items)
```

### Backend Architecture

**Layered Architecture:**
```
Socket Handlers (sockets/handlers.ts)
      ↓
Services (Business Logic)
      ├── SessionService
      ├── ClusterService
      └── ExportService
      ↓
Models (Data Access Layer)
      ├── SessionModel
      ├── UserModel
      ├── CardModel
      ├── ClusterModel
      ├── VoteModel
      ├── ActionItemModel
      └── IceBreakerModel
      ↓
Database (SQLite)
```

**Key Patterns:**
1. **Event-Driven Architecture**: Socket.IO events trigger service methods
2. **Data Access Layer**: Models abstract database operations
3. **Service Layer**: Business logic separated from data access
4. **Socket Rooms**: Each session is a Socket.IO room for efficient broadcasting

**Critical Implementation Details:**

1. **User Persistence on Disconnect** (handlers.ts:434-442):
   - Users are NOT deleted on disconnect to allow reconnection
   - User cleanup happens only when session is deleted
   - Enables seamless page reload without data loss

2. **Stage Advancement Logic** (SessionService.ts:28-53):
   - Linear progression through predefined stages
   - Auto-reveal cards when entering GROUP stage
   - Host-only operation enforced at service layer

3. **Clustering Algorithm** (ClusterService.ts):
   - Merge two cards: Create new cluster
   - Merge card into cluster: Add to existing cluster
   - Merge two clusters: Combine all cards
   - Maintains card relationships via `clusterId` field

### Data Model

**Entity Relationships:**

```
Session (1) ──< Users (*)
Session (1) ──< Cards (*)
Session (1) ──< Clusters (*)
Session (1) ──< Votes (*)
Session (1) ──< ActionItems (*)
Session (1) ──< IceBreakers (*)

Cluster (1) ──< Cards (*) [via clusterId]
Card (1) ──< Votes (*) [polymorphic via targetId]
Cluster (1) ──< Votes (*) [polymorphic via targetId]
User (1) ──< Votes (*)
User (1) ──< Cards (*)
User (1) ──< IceBreakers (*)
```

**Core Entities:**

```typescript
// Session - Main retrospective session
interface Session {
  id: string;
  hostId: string;                    // UUID of host user
  name: string;                      // Session display name
  stage: SessionStage;               // Current stage enum
  settings: SessionSettings;         // Configuration object
  timerEndAt: number | null;         // Unix timestamp
  iceBreakersRevealed: boolean;      // Whether to show ice breaker responses
  createdAt: number;
  updatedAt: number;
}

// User - Session participant
interface User {
  id: string;
  sessionId: string;
  displayName: string;
  isHost: boolean;                   // Only one host per session
  color: string;                     // Hex color for visual identification
  cursorPosition: { x: number; y: number } | null;
  joinedAt: number;
}

// Card - Retrospective card/sticky note
interface Card {
  id: string;
  sessionId: string;
  userId: string;                    // Creator
  category: 'wentWell' | 'toImprove' | 'actionItem';
  content: string;
  color: string;
  position: { x: number; y: number };
  clusterId: string | null;          // Null if not clustered
  revealed: boolean;                 // Hidden during REFLECT stage
  createdAt: number;
  updatedAt: number;
}

// Cluster - Group of related cards
interface Cluster {
  id: string;
  sessionId: string;
  cardIds: string[];                 // Array of card IDs
  category: string;
  title: string;                     // Cluster name/label
  color: string;
  position: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

// Vote - Dot vote on card or cluster
interface Vote {
  id: string;
  sessionId: string;
  userId: string;
  targetId: string;                  // Card or Cluster ID
  targetType: 'card' | 'cluster';    // Polymorphic relationship
  createdAt: number;
}

// ActionItem - Concrete action with owner
interface ActionItem {
  id: string;
  sessionId: string;
  owner: string;                     // Person responsible
  task: string;                      // Action description
  completed: boolean;
  createdAt: number;
}

// IceBreaker - Ice breaker response
interface IceBreaker {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: 'text' | 'gif' | 'drawing';  // Future: support rich media
  createdAt: number;
}

// SessionStage - Linear progression
enum SessionStage {
  SETUP = 'setup',
  ICE_BREAKER = 'ice_breaker',
  REFLECT = 'reflect',
  GROUP = 'group',
  VOTE = 'vote',
  ACT = 'act',
  COMPLETE = 'complete'
}
```

### Clustering Algorithm

When a card is dragged onto another:
1. **Neither clustered** → Create new cluster
2. **Source clustered, target not** → Add target to source cluster
3. **Target clustered, source not** → Add source to target cluster
4. **Both in same cluster** → No-op
5. **Both in different clusters** → Merge clusters

## Real-Time Communication

### Socket.IO Event Flow

**Connection & Session Management:**

```typescript
// Client → Server: Join a session
socket.emit('join:session', {
  sessionId: string,
  displayName: string,
  hostId?: string,     // Present if user is host
  userId?: string      // Present if reconnecting
});

// Server → Client: Full session state sync
socket.on('session:state', {
  session: Session,
  users: User[],
  cards: Card[],
  clusters: Cluster[],
  votes: Vote[],
  actionItems: ActionItem[],
  iceBreakers: IceBreaker[]
});

// Server → All: New user joined
socket.on('user:joined', user: User);

// Server → All: User disconnected
socket.on('user:left', { userId: string });
```

**Card Operations:**

```typescript
// Client → Server: Create new card
socket.emit('card:create', {
  userId: string,
  category: string,
  content: string,
  color: string,
  position: { x: number, y: number },
  revealed: boolean
});

// Server → All: Card created
socket.on('card:created', card: Card);

// Client → Server: Update card
socket.emit('card:update', {
  id: string,
  updates: Partial<Card>
});

// Server → All: Card updated
socket.on('card:updated', card: Card);

// Client → Server: Delete card
socket.emit('card:delete', { id: string });

// Server → All: Card deleted
socket.on('card:deleted', { id: string });
```

**Clustering:**

```typescript
// Client → Server: Merge two cards
socket.emit('cluster:create', {
  sourceCardId: string,
  targetCardId: string
});

// Server → All: Cluster created
socket.on('cluster:created', cluster: Cluster);

// Client → Server: Update cluster
socket.emit('cluster:update', {
  id: string,
  updates: Partial<Cluster>
});

// Server → All: Cluster updated
socket.on('cluster:updated', cluster: Cluster);

// Client → Server: Ungroup cluster
socket.emit('cluster:ungroup', { clusterId: string });

// Server → All: Cluster deleted
socket.on('cluster:deleted', { id: string });
```

**Voting:**

```typescript
// Client → Server: Cast vote
socket.emit('vote:cast', {
  targetId: string,
  targetType: 'card' | 'cluster'
});

// Server → All: Vote added
socket.on('vote:added', vote: Vote);

// Client → Server: Remove vote
socket.emit('vote:remove', { voteId: string });

// Server → All: Vote removed
socket.on('vote:removed', { voteId: string });
```

**Ice Breaker:**

```typescript
// Client → Server: Share ice breaker response
socket.emit('icebreaker:create', {
  content: string,
  type: 'text' | 'gif' | 'drawing'
});

// Server → All: Ice breaker created
socket.on('icebreaker:created', iceBreaker: IceBreaker);

// Client → Server: Reveal all responses (host only)
socket.emit('icebreaker:reveal');

// Server → All: Ice breakers revealed
socket.on('icebreaker:revealed', {
  iceBreakersRevealed: boolean
});
```

**Session Control (Host Only):**

```typescript
// Client → Server: Advance to next stage
socket.emit('stage:advance');

// Server → All: Stage changed
socket.on('stage:changed', { stage: SessionStage });

// Client → Server: Start timer
socket.emit('timer:start', { duration: number });

// Server → All: Timer tick
socket.on('timer:tick', { remainingSeconds: number });

// Client → Server: Export session
socket.emit('session:export');

// Server → Client: Exported markdown
socket.on('session:exported', { markdown: string });
```

**Real-Time Cursors:**

```typescript
// Client → Server: Cursor moved
socket.emit('cursor:move', { x: number, y: number });

// Server → All: Cursor position updated
socket.on('cursor:updated', {
  userId: string,
  position: { x: number, y: number }
});
```

**Error Handling:**

```typescript
// Server → Client: Error occurred
socket.on('error', { message: string });
```

### Socket Room Strategy

- Each session has its own Socket.IO room (roomId = sessionId)
- Users join their session's room on `join:session`
- Broadcasts use `io.to(sessionId).emit()` for efficiency
- Only users in the same session receive updates

## Development Guide

### Project File Structure

```
retros/
├── backend/src/
│   ├── index.ts                    # Express + Socket.IO server setup
│   ├── db/
│   │   ├── database.ts             # SQLite connection singleton
│   │   └── schema.sql              # Database schema definition
│   ├── models/                     # Data Access Layer (DAL)
│   │   ├── Session.ts              # CRUD for sessions table
│   │   ├── User.ts                 # CRUD for users table
│   │   ├── Card.ts                 # CRUD for cards table
│   │   ├── Cluster.ts              # CRUD for clusters table
│   │   ├── Vote.ts                 # CRUD for votes table
│   │   ├── ActionItem.ts           # CRUD for action_items table
│   │   └── IceBreaker.ts           # CRUD for ice_breakers table
│   ├── services/                   # Business Logic Layer
│   │   ├── SessionService.ts       # Session lifecycle, stage management
│   │   ├── ClusterService.ts       # Card clustering logic
│   │   └── ExportService.ts        # Markdown export generation
│   └── sockets/
│       └── handlers.ts             # All Socket.IO event handlers
│
├── frontend/src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Home page - create session
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── session/[id]/page.tsx   # Main session page
│   ├── components/
│   │   ├── Stages/                 # Stage-specific components
│   │   │   ├── SetupStage.tsx      # Waiting room
│   │   │   ├── IceBreakerStage.tsx # Ice breaker activity
│   │   │   ├── ReflectStage.tsx    # Card creation
│   │   │   ├── GroupStage.tsx      # Drag & drop clustering
│   │   │   ├── VoteStage.tsx       # Voting interface
│   │   │   └── ActStage.tsx        # Action items
│   │   └── Board/                  # Shared board components
│   │       ├── Card.tsx            # Draggable card
│   │       └── Cluster.tsx         # Card group
│   ├── context/
│   │   └── SessionContext.tsx      # Global state + Socket.IO
│   ├── lib/
│   │   └── socket.ts               # Socket.IO client singleton
│   └── types/
│       └── index.ts                # Frontend-specific types
│
└── shared/
    └── types/
        └── index.ts                # Shared types between FE/BE
```

### Common Development Tasks

#### 1. Adding a New Socket Event

**Backend (handlers.ts):**
```typescript
socket.on('my-event:create', (data: MyEventData) => {
  if (!socketData.sessionId) return;

  try {
    // Validate data
    if (!data.requiredField) {
      socket.emit('error', { message: 'Missing required field' });
      return;
    }

    // Business logic
    const result = MyService.create(data);

    // Broadcast to all in session
    io.to(socketData.sessionId).emit('my-event:created', result);
  } catch (error: any) {
    socket.emit('error', { message: error.message });
  }
});
```

**Frontend (SessionContext.tsx):**
```typescript
// 1. Add socket listener in useEffect
newSocket.on('my-event:created', (data: MyEvent) => {
  setMyEvents(prev => [...prev, data]);
});

// 2. Add action function
const createMyEvent = useCallback((data: MyEventData) => {
  socket?.emit('my-event:create', data);
}, [socket]);

// 3. Export from context
return (
  <SessionContext.Provider value={{ createMyEvent, ... }}>
```

**Frontend (Component):**
```typescript
const { createMyEvent, myEvents } = useSession();

const handleCreate = () => {
  createMyEvent({ requiredField: 'value' });
};
```

#### 2. Adding a New Database Table

**1. Update schema.sql:**
```sql
CREATE TABLE IF NOT EXISTS my_table (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  some_field TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_my_table_session ON my_table(session_id);
```

**2. Create Model (models/MyTable.ts):**
```typescript
import { getDatabase } from '../db/database';
import { MyTable } from '../../../shared/types';

export class MyTableModel {
  static create(item: MyTable): MyTable {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO my_table (id, session_id, some_field, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(item.id, item.sessionId, item.someField, item.createdAt);
    return item;
  }

  static findById(id: string): MyTable | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM my_table WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      sessionId: row.session_id,
      someField: row.some_field,
      createdAt: row.created_at
    };
  }

  static findBySessionId(sessionId: string): MyTable[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM my_table WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];
    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      someField: row.some_field,
      createdAt: row.created_at
    }));
  }

  static update(id: string, updates: Partial<MyTable>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.someField !== undefined) {
      fields.push('some_field = ?');
      values.push(updates.someField);
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE my_table SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM my_table WHERE id = ?');
    stmt.run(id);
  }
}
```

**3. Add TypeScript interface (shared/types/index.ts):**
```typescript
export interface MyTable {
  id: string;
  sessionId: string;
  someField: string;
  createdAt: number;
}
```

**4. Rebuild containers:**
```bash
docker-compose down -v  # Deletes database
docker-compose up -d --build
```

#### 3. Adding a New Stage

**1. Add to SessionStage enum (shared/types/index.ts):**
```typescript
export enum SessionStage {
  SETUP = 'setup',
  ICE_BREAKER = 'ice_breaker',
  MY_NEW_STAGE = 'my_new_stage',  // Add here
  REFLECT = 'reflect',
  // ...
}
```

**2. Update stage order (SessionService.ts):**
```typescript
const stages = [
  SessionStage.SETUP,
  SessionStage.ICE_BREAKER,
  SessionStage.MY_NEW_STAGE,  // Add here
  SessionStage.REFLECT,
  // ...
];
```

**3. Create component (frontend/src/components/Stages/MyNewStage.tsx):**
```typescript
'use client';

import { useSession } from '../../context/SessionContext';

export default function MyNewStage() {
  const { session, users, currentUser, isHost } = useSession();

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My New Stage</h2>
      {/* Your stage UI */}
    </div>
  );
}
```

**4. Import and render (frontend/src/app/session/[id]/page.tsx):**
```typescript
import MyNewStage from '../../../components/Stages/MyNewStage';

// In render:
{session.stage === SessionStage.MY_NEW_STAGE && <MyNewStage />}
```

#### 4. Debugging Socket Events

**Backend logging:**
```typescript
socket.on('my-event', (data) => {
  console.log('📥 Received my-event:', data);
  console.log('Socket ID:', socket.id);
  console.log('Session ID:', socketData.sessionId);
  console.log('User ID:', socketData.userId);

  // Process...

  console.log('📤 Emitting my-event:created');
  io.to(socketData.sessionId).emit('my-event:created', result);
  console.log('✅ Event emitted successfully');
});
```

**Frontend logging:**
```typescript
useEffect(() => {
  console.log('🔌 Setting up socket listeners');

  newSocket.on('my-event:created', (data) => {
    console.log('📥 Received my-event:created:', data);
    setMyEvents(prev => [...prev, data]);
  });

  return () => {
    console.log('🔌 Cleaning up socket listeners');
    newSocket.off('my-event:created');
  };
}, []);
```

**Check socket connection:**
```typescript
const { socket, connected } = useSession();
console.log('Socket connected:', connected);
console.log('Socket ID:', socket?.id);
```

### Key Implementation Patterns

#### Pattern 1: Reconnection Logic

**How it works:**
1. On session join, user ID stored in localStorage: `user_${sessionId}`
2. On page reload, user ID is sent with join request
3. Backend checks if user ID exists and matches session
4. If match, returns existing user instead of creating new one
5. User maintains same ID, votes, and card ownership

**Implementation (frontend/src/app/session/[id]/page.tsx):**
```typescript
const handleJoin = () => {
  const hostId = localStorage.getItem(`host_${sessionId}`);
  const userId = localStorage.getItem(`user_${sessionId}`);

  joinSession(sessionId, displayName);
  // joinSession internally passes userId to backend
};
```

**Implementation (backend/src/services/SessionService.ts:71-82):**
```typescript
if (userId) {
  const existingUser = UserModel.findById(userId);
  if (existingUser && existingUser.sessionId === sessionId) {
    console.log('Reconnecting existing user:', existingUser.displayName);
    return { user: existingUser, session };
  }
}
```

#### Pattern 2: Host-Only Operations

**Backend enforcement (handlers.ts:334-352):**
```typescript
socket.on('stage:advance', () => {
  if (!socketData.userId || !socketData.sessionId) return;

  const user = UserModel.findById(socketData.userId);
  if (!user || !user.isHost) {
    socket.emit('error', { message: 'Only host can advance stage' });
    return;
  }

  // Proceed with operation
});
```

**Frontend UI (component):**
```typescript
const { isHost } = useSession();

{isHost && (
  <button onClick={advanceStage}>
    Next Stage
  </button>
)}
```

#### Pattern 3: Optimistic UI (Not Implemented)

Current implementation waits for server confirmation. To add optimistic updates:

```typescript
const createCard = useCallback((data: CardData) => {
  // Optimistic update
  const tempId = `temp-${Date.now()}`;
  const tempCard = { ...data, id: tempId };
  setCards(prev => [...prev, tempCard]);

  // Send to server
  socket?.emit('card:create', data);

  // Server response replaces temp card
  socket?.once('card:created', (serverCard) => {
    setCards(prev => prev.map(c => c.id === tempId ? serverCard : c));
  });
}, [socket]);
```

### Testing Strategies

#### Manual Testing Workflow

1. **Start fresh containers:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

2. **Open multiple browser windows:**
   - Window 1: Create session as host
   - Window 2 (incognito): Join as participant

3. **Test each stage:**
   - Verify real-time updates appear in both windows
   - Check console for errors
   - Monitor backend logs: `docker-compose logs -f backend`

4. **Test reconnection:**
   - Reload page in Window 2
   - Verify user maintains identity and data

#### Backend Testing

```bash
cd backend
npm test  # If tests are configured
```

**Manual API testing:**
```bash
# Health check
curl http://localhost:4000/health

# Create session
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session"}'
```

## Configuration

### Environment Variables

```bash
# Backend
PORT=3001
DATABASE_PATH=/app/data/retro.db
CORS_ORIGIN=http://localhost:3000
SESSION_CLEANUP_INTERVAL=3600000  # 1 hour
MAX_SESSION_AGE=86400000          # 24 hours

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Project Structure

```
retro-app/
├── backend/
│   ├── src/
│   │   ├── db/              # Database setup and schema
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   ├── sockets/         # Socket.io handlers
│   │   └── index.ts         # Server entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   ├── context/         # React context (session state)
│   │   ├── lib/             # Utilities and API client
│   │   └── types/           # TypeScript types
│   └── Dockerfile
├── shared/
│   └── types/               # Shared TypeScript types
└── docker-compose.yml
```

## API Endpoints

### REST API

- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session info
- `GET /health` - Health check

### Socket.io Events

See [Architecture](#architecture) section for real-time events.

## Database Schema

SQLite database with the following tables:
- `sessions` - Retrospective sessions
- `users` - Session participants
- `cards` - Retro cards
- `clusters` - Card groupings
- `votes` - User votes
- `action_items` - Action items with owners
- `ice_breakers` - Ice breaker activities

## Deployment

### Docker Compose (Production)

```bash
docker-compose up -d
```

### Scaling Considerations

For production with multiple instances:
- Use Redis adapter for Socket.io
- Use PostgreSQL instead of SQLite
- Add load balancer (nginx)
- Enable HTTPS with Let's Encrypt

## Troubleshooting

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "3002:3001"  # Backend
  - "3001:3000"  # Frontend
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### Build Issues
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - Feel free to use this for your team's retrospectives!

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions

## Roadmap

- [ ] Anonymous mode toggle
- [ ] Custom templates
- [ ] PDF export
- [ ] Session history
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Drawing/sketching on ice breaker
- [ ] GIF picker integration
- [ ] Session persistence options

---

Built with ❤️ for better retrospectives
