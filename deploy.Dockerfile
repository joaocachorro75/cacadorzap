# ESTÁGIO 1: Compilação do App (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências de forma limpa
RUN npm ci

# Copia o restante do código
COPY . .

# Gera o build de produção (pasta /dist)
RUN npm run build

# ESTÁGIO 2: Servidor Web de Alta Performance (Nginx)
FROM nginx:stable-alpine

# Copia os arquivos do estágio de build para o diretório do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do servidor
EXPOSE 80

# Inicia o servidor
CMD ["nginx", "-g", "daemon off;"]