
# --- deps: install prod deps di container (tanpa dev) ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- build: build CSS/Tailwind dan (opsional) hal lain ---
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# build CSS
RUN npm run css:build

# --- runner: image final produksi ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy hasil build dan deps
COPY --from=build /app/public /app/public
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

EXPOSE 3131
CMD ["node", "src/app.js"]
