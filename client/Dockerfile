# ---------- Stage 1: build the Vite bundle ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# In Docker the browser talks to nginx, which proxies /api to the backend.
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---------- Stage 2: serve with nginx ----------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
