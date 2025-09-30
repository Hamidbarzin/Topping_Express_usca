FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (avoid npm ci lock issues)
RUN npm install --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set environment
ENV NODE_ENV=production

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Start the application
CMD ["node", "dist/index.js"]
