# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install dependencies
RUN npm install --workspace=@formai/web --workspace=@formai/shared --include-workspace-root

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build shared package first, then web
RUN npm run build --workspace=@formai/shared

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build --workspace=@formai/web

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
