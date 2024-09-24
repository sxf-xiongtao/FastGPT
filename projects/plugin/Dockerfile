# --------- runner -----------
FROM oven/bun:alpine AS runner
WORKDIR /app

ARG proxy

# create user and use it

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache\
  curl ca-certificates\
  ttf-freefont fontconfig\
  ca-certificates\
  chromium\
  nss\
  freetype\
  harfbuzz\
  ttf-freefont\
  && update-ca-certificates

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# copy running files
COPY . /app

# install node_modules
RUN bun i -p

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030

EXPOSE 3030

ENV serverPath=./src/index.ts
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

USER pptruser

ENTRYPOINT ["sh","-c","bun ${serverPath}"]
