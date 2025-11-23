FROM node:20

# нужен netcat для проверки Postgres
RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

RUN npm run build

CMD ["npm","run","start"]
