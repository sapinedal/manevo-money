FROM node:20-alpine AS builder

# Install system dependencies required by Prisma engine on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy root lockfile and package configuration files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (only production and dev needed to build)
RUN npm ci

# Copy full monorepo content
COPY . .

# Generate Prisma client using the schema
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the NestJS API workspace
RUN npm run build --workspace=apps/api

# Final production stage
FROM node:20-alpine

# Install system dependencies required by Prisma engine on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy build artifacts and dependencies from builder stage
COPY --from=builder /app ./

EXPOSE 4000

# Start NestJS API in production mode
CMD ["npm", "run", "start:prod", "--workspace=apps/api"]
