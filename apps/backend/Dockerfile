FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY ./prisma ./prisma

COPY . .

RUN npx prisma generate

RUN npm run build

RUN npm prune --production

FROM node:23-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json .

RUN apk add --no-cache openssl

EXPOSE 3000

CMD ["node", "dist/index.js"]
