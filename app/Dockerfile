# Dockerfile node기반이미지 사용
FROM node:12

WORKDIR /usr/tmp/nodejs
# 현재 위치(경로)를 확인하려면 server.js가 위치한 디렉토리에서 'pwd' 명령어를 입력하면 된다.

COPY package*.json ./

RUN npm install
COPY . .

ENV NODE_ENV development
EXPOSE 0000
CMD [ "node", "server.js" ]