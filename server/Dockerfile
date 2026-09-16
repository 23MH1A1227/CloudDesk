# ---------- CloudDesk backend ----------
FROM node:20-alpine

WORKDIR /app

# Prisma needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

# Install dependencies first so Docker can cache this layer.
COPY package*.json ./
RUN npm install --omit=dev

# Generate the Prisma client against the schema.
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads && chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 5000

# migrate deploy is idempotent, so the API container can safely own schema rollout.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
