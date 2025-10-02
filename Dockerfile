# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies
RUN npm ci

# Copy configuration files
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.ts postcss.config.js ./

# Copy source directories explicitly
COPY client ./client
COPY server/index.js ./server/index.js
COPY shared ./shared

# Build frontend (creates server/public/)
RUN npm run build

# List what was built (for debugging)
RUN ls -la server/public/ || echo "Public dir not created"

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy shared code
COPY shared ./shared

# Copy server code
COPY server/index.js ./server/index.js

# Copy built frontend from builder
COPY --from=builder /app/server/public ./server/public

# Verify files are present
RUN echo "=== Checking production files ===" && \
    ls -la server/ && \
    ls -la server/public/ && \
    test -f server/public/index.html && echo "✓ index.html found" || echo "✗ index.html missing"

# Expose port
EXPOSE 10000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]
