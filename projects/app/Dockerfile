# --------- install dependence -----------
FROM node:20.13-alpine AS mainDeps
WORKDIR /app

ARG proxy

# if proxy exists, set proxy
RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache libc6-compat && npm install -g pnpm@8.6.2
RUN [ -z "$proxy" ] || pnpm config set registry https://registry.npmmirror.com

# copy packages and one project
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ./FastGPT/packages ./FastGPT/packages
COPY ./projects/app/package.json ./projects/app/package.json

RUN [ -f pnpm-lock.yaml ] || (echo "Lockfile not found." && exit 1)

RUN pnpm i

# --------- builder -----------
FROM node:20.13-alpine AS builder
WORKDIR /app

ARG proxy

# copy common node_modules and one project node_modules
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY --from=mainDeps /app/FastGPT/packages ./FastGPT/packages
COPY --from=mainDeps /app/node_modules ./node_modules
COPY ./projects/app ./projects/app
COPY --from=mainDeps /app/projects/app/node_modules ./projects/app/node_modules

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache libc6-compat && npm install -g pnpm@8.6.2
RUN pnpm --filter=app build


# --------- runner -----------
FROM node:20.13-alpine AS runner
WORKDIR /app

ARG proxy

# create user and use it
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache curl ca-certificates \
  && update-ca-certificates

# copy running files
COPY --from=builder /app/projects/app/public ./projects/app/public
COPY --from=builder /app/projects/app/next.config.js ./projects/app/next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/static ./projects/app/.next/static
# copy server chunks
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/server/chunks /app/projects/app/.next/server/chunks
# copy worker
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/server/worker /app/projects/app/.next/server/worker

# copy standload packages
COPY --from=mainDeps /app/node_modules/tiktoken ./node_modules/tiktoken
RUN rm -rf ./node_modules/tiktoken/encoders
COPY --from=mainDeps /app/node_modules/@zilliz/milvus2-sdk-node ./node_modules/@zilliz/milvus2-sdk-node

# copy package.json to version file
COPY --from=builder /app/projects/app/package.json ./package.json 
# copy config
COPY ./projects/app/data/formConfig.json /app/data/formConfig.json
COPY ./projects/app/data/config.json /app/data/config.json


ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000

EXPOSE 3000

USER nextjs

ENV serverPath=./projects/app/server.js

ENTRYPOINT ["sh","-c","node ${serverPath}"]