FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Set environment
ENV NODE_ENV=production

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Start the application
CMD ["node", "dist/index.js"]
