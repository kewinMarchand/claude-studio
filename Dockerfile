# syntax=docker/dockerfile:1

# --- Étape 1 : dépendances ---
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Étape 2 : build ---
FROM node:24-slim AS builder
WORKDIR /app
ENV NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Étape 3 : runtime ---
# slim (et non alpine) : le CLI `claude` a besoin de la glibc.
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Le CLI Claude Code, que l'app pilote en sous-processus (binaire `claude` global).
RUN npm install -g @anthropic-ai/claude-code
ENV CLAUDE_BIN=claude

# Sortie standalone de Next : server.js + node_modules minimal.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
