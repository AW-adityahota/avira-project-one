FROM node:23-alpine
WORKDIR /app

COPY package* .
COPY ./prisma .

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build
RUN apk add --no-cache openssl


EXPOSE 3000

# starting the img commands 
CMD [ "node","dist/index.js" ]