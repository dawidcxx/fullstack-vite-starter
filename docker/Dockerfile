FROM node:26-alpine AS builder

RUN npm install -g pnpm@11.10.0

RUN apk add --no-cache git

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY ./packages/backend/package.json ./packages/backend/
COPY ./packages/web/package.json ./packages/web/
COPY ./packages/common/package.json ./packages/common/

RUN pnpm install --frozen-lockfile

COPY ./packages/backend ./packages/backend
COPY ./packages/web ./packages/web
COPY ./packages/common ./packages/common

RUN pnpm run build:common
RUN pnpm run build:web
RUN pnpm run build:backend

FROM node:26-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./
ENV PORT=8080
ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 8080

CMD ["node", "main.js"]
