FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY core ./core/

RUN npm ci --only=production

COPY . .

CMD [ "node", "src/index.js" ]