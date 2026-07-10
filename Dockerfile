# ─── deps ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ─── build ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# gera o Prisma Client e o build de produção (sem acesso a banco)
RUN pnpm prisma generate && pnpm build

# ─── runtime ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable pnpm
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY package.json pnpm-workspace.yaml next.config.ts ./
EXPOSE 3000
# aplica migrations e sobe (o seed é manual: pnpm db:seed)
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
