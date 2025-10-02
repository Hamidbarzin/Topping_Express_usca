# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy all source code
COPY . .

# Build the frontend (outputs to server/public/)
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy server code from source
COPY server server

# Copy shared code from source
COPY shared shared

# Copy built frontend from builder stage
COPY --from=builder /app/server/public server/public

# Expose port
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
