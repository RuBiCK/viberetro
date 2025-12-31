FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments with fallback to production URLs
ARG NEXT_PUBLIC_API_URL=https://viberetroapi.marcote.net
ARG NEXT_PUBLIC_SOCKET_URL=https://viberetroapi.marcote.net

# Set as environment variables for the build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

# Copy frontend files
COPY frontend/package*.json frontend/next.config.js frontend/tsconfig.json frontend/tailwind.config.ts frontend/postcss.config.js ./

# Install dependencies
RUN npm install

# Copy shared types to the right location
COPY shared ../shared

# Copy source code
COPY frontend/src ./src
COPY frontend/public ./public

# Build Next.js app with environment variables embedded
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install production dependencies
COPY frontend/package*.json ./
RUN npm install --only=production

# Copy built app from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
