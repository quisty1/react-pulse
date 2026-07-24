# Базовый образ с pnpm через corepack
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Установка зависимостей только для API и его workspace-зависимостей
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @pulse/api... --frozen-lockfile || pnpm install --filter @pulse/api...

# Сборка shared + Prisma generate + tsc
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @pulse/shared build
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm build

# Runtime: непривилегированный пользователь, миграции при старте
FROM node:20-alpine AS runner
RUN addgroup -S pulse && adduser -S pulse -G pulse
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./node_modules/@pulse/shared
RUN mkdir -p /app/uploads && chown -R pulse:pulse /app
USER pulse
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
