# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN npm install --workspace=@formai/api --workspace=@formai/shared --include-workspace-root

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared package first, then API
RUN npm run build --workspace=@formai/shared
RUN npm run build --workspace=@formai/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
