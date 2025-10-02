# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy server code and built frontend
COPY --from=builder /app/server/public ./server/public
COPY --from=builder /app/server/index.js ./server/index.js
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]
