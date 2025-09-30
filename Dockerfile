FROM node:20-alpine

WORKDIR /app

# Only copy package files to leverage Docker layer caching
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy server code (serves built frontend from server/public)
COPY server ./server

ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "server/index.js"]
