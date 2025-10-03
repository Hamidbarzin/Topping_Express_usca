# ============================================
# Stage 1: Build stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy configuration files
COPY tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js ./

# Copy source code
COPY client ./client
COPY server/index.js ./server/index.js
COPY shared ./shared

# Build frontend (outputs to server/public/)
RUN npm run build

# Verify build output
RUN echo "=== Build verification ===" && \
    ls -la server/public/ && \
    test -f server/public/index.html && echo "✓ Build successful" || (echo "✗ Build failed" && exit 1)

# ============================================
# Stage 2: Production stage
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy shared code
COPY shared ./shared

# Copy server code
COPY server/index.js ./server/index.js

# Copy built frontend from builder stage
COPY --from=builder /app/server/public ./server/public

# Verify production files
RUN echo "=== Production verification ===" && \
    ls -la server/ && \
    test -f server/index.js && echo "✓ Server found" || exit 1 && \
    test -f server/public/index.html && echo "✓ Frontend found" || exit 1

# Expose port
EXPOSE 10000

# Set production environment
ENV NODE_ENV=production
ENV PORT=10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:10000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server/index.js"]
