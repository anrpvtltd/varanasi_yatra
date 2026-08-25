# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Node.js Server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Backend Dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy Built Frontend & Backend Source
COPY --from=builder /app/dist ./dist
COPY backend ./backend

EXPOSE 5001

CMD ["node", "backend/server.js"]
