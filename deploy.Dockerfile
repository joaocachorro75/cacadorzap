# ESTÁGIO 1: Build do Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copia TUDO primeiro para garantir que o package.json seja encontrado
# Se este passo falhar no log, seu "Contexto de Build" está vazio no Easypanel
COPY . .

# Instalação com timeout extendido para redes instáveis
RUN npm install --network-timeout=100000

# Compilação para produção
RUN npm run build

# ESTÁGIO 2: Servidor Web
FROM nginx:stable-alpine

# Limpa configurações antigas
RUN rm /etc/nginx/conf.d/default.conf

# Injeta a configuração do Nginx diretamente no Dockerfile (Self-contained)
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, no-transform";\n\
        access_log off;\n\
    }\n\
    error_page 404 /index.html;\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]