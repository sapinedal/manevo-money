FROM node:20-alpine AS builder

ARG VITE_API_URL
WORKDIR /app

# Copy root lockfile and package configuration files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy full monorepo content
COPY . .

# Inject production API URL environment variable for Vite
ENV VITE_API_URL=$VITE_API_URL

# Build the React application
RUN npm run build --workspace=apps/web

# Final stage: Serve static assets with Nginx
FROM nginx:alpine

# Copy React build assets to Nginx html directory
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
