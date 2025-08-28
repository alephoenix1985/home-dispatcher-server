FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY core ./core/

RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

RUN npm i --only=production

RUN echo "Final directory structure before copying src:" && ls -la

COPY src ./src

CMD [ "node", "src/index.js" ]