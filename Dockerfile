FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY core ./core/

RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

RUN ls

RUN npm i --only=production

COPY . .

CMD [ "node", "src/index.js" ]