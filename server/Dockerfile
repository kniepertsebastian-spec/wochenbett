FROM node:22-alpine
WORKDIR /srv
COPY package.json app.mjs index.mjs ./
ENV NODE_ENV=production DB_PATH=/data/wochenbett.sqlite PORT=3000 NODE_NO_WARNINGS=1
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "index.mjs"]
