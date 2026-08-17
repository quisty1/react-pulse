# Base image with pnpm via corepack
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Vite bundle build; VITE_* are baked in at this stage
FROM base AS build
ARG VITE_API_URL=http://localhost:3001
ARG VITE_SOCKET_URL=http://localhost:3001
ARG VITE_APP_NAME=Pulse
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --filter @pulse/web... || pnpm install --filter @pulse/web...
RUN pnpm --filter @pulse/shared build
RUN pnpm --filter @pulse/web build

# Serve static files via nginx
FROM nginx:1.27-alpine AS runner
RUN adduser -D -H -u 1001 pulse
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
USER nginx
CMD ["nginx", "-g", "daemon off;"]
