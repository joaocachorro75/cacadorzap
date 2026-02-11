
# Instruções de Deploy (Docker)

Como o sistema de preview pode restringir a criação do arquivo `Dockerfile` na raiz, utilize o conteúdo abaixo para seu deploy manual:

```dockerfile
# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Execução (Nginx)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Comandos de Build:
1. Salve o conteúdo acima em um arquivo chamado `Dockerfile` na sua máquina local.
2. Execute: `docker build -t cacador-grupos .`
3. Execute: `docker run -p 8080:80 -e API_KEY=SUA_CHAVE_AQUI cacador-grupos`
