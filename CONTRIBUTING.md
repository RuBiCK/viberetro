# Contributing to Sprint Retrospective Tool

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd retro-app
   ```

2. **Backend Development**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```
   Backend runs on http://localhost:3001

3. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:3000

## Project Structure

- `/backend` - Node.js + Express + Socket.io server
- `/frontend` - Next.js + React application
- `/shared` - Shared TypeScript types
- `/backend/src/db` - Database schema and connection
- `/backend/src/models` - Data models
- `/backend/src/services` - Business logic
- `/backend/src/sockets` - Real-time event handlers
- `/frontend/src/components` - React components
- `/frontend/src/context` - Global state management

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` type where possible
- Use meaningful variable names

### React
- Use functional components with hooks
- Keep components small and focused
- Use 'use client' directive for client components in Next.js
- Prefer composition over prop drilling

### Backend
- Keep services stateless
- Handle errors gracefully
- Use prepared statements for SQL
- Validate all inputs

## Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing patterns
   - Test your changes thoroughly

3. **Test locally**
   ```bash
   docker-compose up --build
   ```
   Test all stages of the retrospective flow

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions
   - `chore:` Build/config changes

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## Feature Ideas

Looking for something to work on? Check these ideas:

### Easy
- [ ] Add more retrospective templates
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Export to PDF
- [ ] Dark mode support

### Medium
- [ ] Drawing/sketching on ice breaker
- [ ] GIF picker integration
- [ ] Custom card colors
- [ ] Session history
- [ ] Email notifications for action items

### Hard
- [ ] Multi-language support
- [ ] Voice/video chat integration
- [ ] AI-powered insights
- [ ] Analytics dashboard
- [ ] Redis adapter for Socket.io scaling

## Testing Guidelines

### Manual Testing Checklist
- [ ] Create a session
- [ ] Join with multiple users (test in incognito windows)
- [ ] Test all 6 stages
- [ ] Create and cluster cards
- [ ] Cast votes
- [ ] Create action items
- [ ] Export to Markdown
- [ ] Timer functionality
- [ ] Real-time updates work across clients

### Browser Testing
Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Database Changes

If modifying the database schema:

1. Update `/backend/src/db/schema.sql`
2. Update corresponding models in `/backend/src/models`
3. Update shared types in `/shared/types`
4. Test with fresh database:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

## Adding New Socket Events

1. Define event in `/shared/types/index.ts` (`SocketEvents` interface)
2. Implement handler in `/backend/src/sockets/handlers.ts`
3. Use event in frontend via `useSession()` hook

## Performance Considerations

- Throttle cursor movements (already implemented)
- Use React.memo for expensive components
- Optimize database queries with indexes
- Consider pagination for large card sets

## Security Considerations

- Validate all user inputs
- Sanitize content before storing
- Use parameterized SQL queries
- Rate limit socket events
- Don't expose internal errors to clients

## Documentation

- Update README.md for major features
- Add JSDoc comments for complex functions
- Update QUICKSTART.md if setup changes
- Include examples in code comments

## Questions?

- Check existing issues and PRs
- Open a discussion for feature proposals
- Ask in PR comments for specific questions

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Celebrate contributions of all sizes

Thank you for contributing! 🎉
