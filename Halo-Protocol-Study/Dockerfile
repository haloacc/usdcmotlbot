# Use Node.js 18 LTS as base
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY react-frontend/package*.json ./react-frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
# (Assuming there's a build script for the backend if needed, 
# otherwise we just copy the source and use ts-node/register in prod or compile)
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/react-frontend/out ./react-frontend/out

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8082

# Expose port
EXPOSE 8082

# Start the application
CMD ["node", "dist/index.js"]
