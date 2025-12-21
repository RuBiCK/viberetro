FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend files
COPY backend/package*.json backend/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy shared types to the right location
COPY shared ../shared

# Copy source code
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install sqlite3 and curl for healthcheck
RUN apk add --no-cache sqlite curl

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm install --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy SQL schema file
COPY backend/src/db/schema.sql ./dist/app/src/db/

# Create data directory for SQLite
RUN mkdir -p /app/data && chmod 755 /app/data

EXPOSE 3001

CMD ["node", "dist/app/src/index.js"]
