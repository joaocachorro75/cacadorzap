# ESTÁGIO 1: Build da Aplicação
FROM node:20-alpine AS build

# Passa a API_KEY para o ambiente de build
ARG API_KEY
ENV API_KEY=$API_KEY

WORKDIR /app

# Copia arquivos de dependências primeiro (otimização de cache)
COPY package.json ./
RUN npm install

# Copia todo o código fonte
COPY . .

# Executa o build do Vite
RUN npm run build

# ESTÁGIO 2: Servidor Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
RUN printf 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n        try_files $uri $uri/ /index.html;\n    }\n}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]