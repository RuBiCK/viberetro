# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeRetro is a real-time collaborative Sprint Retrospective tool with zero-config setup. Built as a monorepo with TypeScript throughout, using Socket.IO for real-time collaboration, Express backend, Next.js 14 frontend, and SQLite database.

**Production URLs:**
- Frontend: https://viberetro.marcote.net (port 3002 → 3000)
- Backend API: https://viberetroapi.marcote.net (port 3001)

## Development Commands

### Docker (Recommended for Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after changes
docker-compose down
docker-compose up -d --build

# Reset database (deletes all data)
docker-compose down -v
docker-compose up -d
```

**Access Points:**
- Frontend: http://localhost:3002
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev          # Development with ts-node
npm run watch        # Development with nodemon
npm run build        # Compile TypeScript
npm start            # Run compiled code
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm start            # Run production build
npm run lint         # Run Next.js linter
```

## Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + React + Socket.IO Client)  │
└────────────────────┬────────────────────────────────┘
                     │ WebSocket (Socket.IO)
┌────────────────────▼────────────────────────────────┐
│  Backend (Express + Socket.IO Server)               │
│  ├─ Socket Handlers (handlers.ts)                   │
│  ├─ Services (Business Logic)                       │
│  ├─ Models (Data Access Layer)                      │
│  └─ Database (SQLite)                               │
└─────────────────────────────────────────────────────┘
```

### Frontend State Management

- **SessionContext.tsx** is the single source of truth for all session state
- Uses React Context API with Socket.IO client integrated directly
- NO optimistic updates - all changes wait for server confirmation
- User reconnection enabled via localStorage: `user_${sessionId}` and `host_${sessionId}`

**Component Structure:**
- `SessionProvider` wraps the session page and manages WebSocket connection
- Stage-specific components: SetupStage, IceBreakerStage, ReflectStage, GroupStage, VoteStage, ActStage
- Shared components in `Board/`: Card, Cluster, Column

### Backend Architecture

**Three-layer pattern:**

1. **Socket Handlers** (`sockets/handlers.ts`): Event listeners and validation
2. **Services** (`services/`): Business logic (SessionService, ClusterService, ExportService)
3. **Models** (`models/`): Database operations (Session, User, Card, Cluster, Vote, ActionItem, IceBreaker)

**Key Implementation Details:**

- **User Persistence** (handlers.ts:434-442): Users are NOT deleted on disconnect to enable reconnection
- **Stage Advancement** (SessionService.ts:28-53): Linear progression through SessionStage enum, host-only operation
- **Clustering Algorithm** (ClusterService.ts): Merge cards/clusters with relationship maintained via `clusterId` field
- **Socket Rooms**: Each session is a Socket.IO room (roomId = sessionId) for efficient broadcasting

### Database Schema (SQLite)

**Core Tables:**
- `sessions`: Retrospective sessions with stage, settings, timer state
- `users`: Session participants with cursor positions
- `cards`: Retrospective cards with content, position, cluster relationship
- `clusters`: Groups of cards with position and title
- `votes`: Polymorphic votes on cards or clusters
- `action_items`: Action items with owners
- `ice_breakers`: Ice breaker responses (text/gif/drawing)

**Relationships:**
- Foreign keys with CASCADE delete for session cleanup
- Polymorphic votes via `target_type` and `target_id`
- Cards link to clusters via `cluster_id` (nullable)

**Migration Note:** Schema includes an ALTER TABLE for `votes_revealed` column (schema.sql:14-16)

## Session Flow & Stages

The retrospective follows a linear stage progression (SessionStage enum):

1. **SETUP**: Waiting room, host configures template and settings
2. **ICE_BREAKER**: Warm-up activity with optional reveal control
3. **REFLECT**: Anonymous card creation (cards blurred to others)
4. **GROUP**: Drag-and-drop clustering to identify themes
5. **VOTE**: Dot voting on cards/clusters (configurable votes per user)
6. **ACT**: Create action items with owners
7. **COMPLETE**: Export results as Markdown

**Stage Advancement:**
- Host-only operation enforced at backend service layer
- Cards auto-reveal when entering GROUP stage
- Timer functionality available for time-boxing stages

## Socket.IO Events

### Connection & State
- `join:session` → `session:state` (full state sync)
- `user:joined`, `user:left` (broadcast to room)
- `cursor:move` → `cursor:updated` (real-time cursors)

### Card Operations
- `card:create` → `card:created`
- `card:update` → `card:updated`
- `card:delete` → `card:deleted`

### Clustering
- `cluster:create` → `cluster:created` (merge two cards)
- `cluster:update` → `cluster:updated`
- `cluster:ungroup` → `cluster:deleted`

### Voting
- `vote:cast` → `vote:added`
- `vote:remove` → `vote:removed`
- `vote:reveal` → `vote:revealed` (host-only, shows vote counts)

### Session Control (Host-Only)
- `stage:advance` → `stage:changed`
- `timer:start` → `timer:tick`
- `icebreaker:reveal` → `icebreaker:revealed`
- `session:export` → `session:exported`

**Error Handling:** All errors emitted via `error` event with message

## Clustering Algorithm

When dragging card A onto card B:
1. **Neither clustered** → Create new cluster with both cards
2. **A clustered, B not** → Add B to A's cluster
3. **B clustered, A not** → Add A to B's cluster
4. **Both in same cluster** → No-op
5. **Both in different clusters** → Merge clusters (combine all cards)

Implementation: `backend/src/services/ClusterService.ts`

## Adding New Features

### Adding a Socket Event

1. Add event types to `shared/types/index.ts` (SocketEvents interface)
2. Backend: Add handler in `backend/src/sockets/handlers.ts`
   - Validate `socketData.sessionId` and `socketData.userId`
   - Call service layer for business logic
   - Broadcast result: `io.to(sessionId).emit('event:name', data)`
   - Emit errors: `socket.emit('error', { message })`
3. Frontend: Add listener in `SessionContext.tsx` useEffect
4. Frontend: Add action function and export from context
5. Component: Use via `const { actionFunction } = useSession()`

### Adding a Database Table

1. Update `backend/src/db/schema.sql` with CREATE TABLE and indexes
2. Create Model class in `backend/src/models/` with CRUD methods
3. Add TypeScript interface to `shared/types/index.ts`
4. Update SessionService to load data in `getSessionState()`
5. Add socket events for create/update/delete operations
6. Rebuild containers: `docker-compose down -v && docker-compose up -d --build`

**Note:** SQLite column naming uses snake_case (e.g., `created_at`), TypeScript uses camelCase (e.g., `createdAt`)

### Adding a Stage

1. Add enum value to `SessionStage` in `shared/types/index.ts`
2. Update stage order array in `SessionService.ts` advanceStage method
3. Create stage component in `frontend/src/components/Stages/`
4. Import and conditionally render in `frontend/src/app/session/[id]/page.tsx`
5. Access context via `const { session, currentUser, isHost } = useSession()`

## Environment Variables

**Backend (.env or docker-compose.yml):**
- `PORT`: Server port (default: 3001)
- `DATABASE_PATH`: SQLite file path
- `CORS_ORIGIN`: Allowed frontend origin
- `CORS_ALLOW_ALL`: Set to 'true' to allow all origins (testing only)
- `SESSION_CLEANUP_INTERVAL`: Cleanup interval in ms (default: 1 hour)
- `MAX_SESSION_AGE`: Session expiry in ms (default: 24 hours)

**Frontend (.env.local or docker-compose.yml):**
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO server URL (usually same as API URL)

## Templates

Four built-in templates defined in `shared/types/index.ts`:
- **START_STOP_CONTINUE**: 3 columns (Start, Stop, Continue)
- **WENT_WELL_IMPROVE**: 2 columns (Went Well, To Improve)
- **FOUR_LS**: 4 columns (Liked, Learned, Lacked, Longed For)
- **MAD_SAD_GLAD**: 3 columns (Mad, Sad, Glad)

Template selected during SETUP stage, determines column structure throughout session.

## Key Implementation Patterns

### User Reconnection
- User ID stored in localStorage on first join: `localStorage.setItem('user_${sessionId}', userId)`
- On reconnection, userId sent with join request
- Backend checks if user exists and matches session (SessionService.ts:71-82)
- Enables seamless page reload without losing identity, votes, or cards

### Host-Only Operations
- Backend validates `user.isHost` before allowing stage advancement, timer control, reveals
- Frontend conditionally renders controls: `{isHost && <button>...}`
- Never trust frontend - always validate on backend

### Real-Time Cursors
- Mouse move events throttled and sent via `cursor:move`
- Backend broadcasts to room via `cursor:updated`
- Position stored in users table, synced on reconnection

### Export to Markdown
- Host triggers `session:export` event
- ExportService generates markdown from session state
- Returned via `session:exported` event to host only
- Includes all cards, clusters, votes, and action items

## Development Tips

### Debugging Socket Events
- Backend: Add console.log in handlers.ts with socket.id and socketData
- Frontend: Add console.log in SessionContext.tsx useEffect listeners
- Check connection: `const { connected } = useSession()`
- Monitor backend logs: `docker-compose logs -f backend`

### Database Queries
- Access DB directly: `docker exec -it retro-backend sh` → `sqlite3 /app/data/retro.db`
- Useful queries:
  - `.tables` - List all tables
  - `.schema sessions` - Show table schema
  - `SELECT * FROM sessions;` - View sessions

### Port Conflicts
If ports 3001 or 3002 are in use, update `docker-compose.yml` ports mapping:
```yaml
ports:
  - "3002:3001"  # Backend (external:internal)
  - "3003:3000"  # Frontend (external:internal)
```

### Rebuilding After Schema Changes
Always rebuild and reset database after modifying schema.sql:
```bash
docker-compose down -v  # -v flag removes volumes (database)
docker-compose up -d --build
```

## File Locations Reference

**Critical Backend Files:**
- `backend/src/index.ts` - Express + Socket.IO server setup
- `backend/src/sockets/handlers.ts` - All Socket.IO event handlers
- `backend/src/services/SessionService.ts` - Session lifecycle, stage management
- `backend/src/services/ClusterService.ts` - Card clustering logic
- `backend/src/db/database.ts` - SQLite connection singleton
- `backend/src/db/schema.sql` - Database schema definition

**Critical Frontend Files:**
- `frontend/src/context/SessionContext.tsx` - Global state + Socket.IO client
- `frontend/src/app/session/[id]/page.tsx` - Main session page, stage routing
- `frontend/src/lib/socket.ts` - Socket.IO client singleton
- `frontend/src/components/Stages/` - Stage-specific UI components

**Shared:**
- `shared/types/index.ts` - All TypeScript interfaces, enums, Socket events
