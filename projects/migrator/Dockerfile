FROM denoland/deno:alpine

RUN apk add --no-cache mongodb-tools

WORKDIR /app
VOLUME [ "/app/data" ]

COPY import.ts export.ts index.ts ./
RUN deno cache import.ts export.ts index.ts

ENTRYPOINT ["deno", "run", "--allow-write=/app/data", "--allow-read=/app/data", "--allow-run", "--allow-env", "index.ts"]
