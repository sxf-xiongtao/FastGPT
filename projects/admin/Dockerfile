# Build stage
FROM node:18 AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .
ENV VITE_PUBLIC_SERVER_URL=''

RUN pnpm build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY package.json pnpm-lock.yaml* ./
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/service ./service
COPY --from=builder /app/dist ./dist

RUN npm install -g pnpm
RUN pnpm install --prod
RUN npm remove -g pnpm

ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
