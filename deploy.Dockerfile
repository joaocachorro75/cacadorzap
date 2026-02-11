# ESTÁGIO 1: Build do Ambiente
FROM node:20-alpine AS build

WORKDIR /app

# 1. Recriação do package.json internamente
RUN echo '{\
  "name": "cacador-grupos-whatsapp",\
  "private": true,\
  "version": "1.0.0",\
  "type": "module",\
  "scripts": {\
    "dev": "vite",\
    "build": "vite build",\
    "preview": "vite preview"\
  },\
  "dependencies": {\
    "@google/genai": "^1.40.0",\
    "react": "^19.2.4",\
    "react-dom": "^19.2.4"\
  },\
  "devDependencies": {\
    "@types/react": "^19.0.0",\
    "@types/react-dom": "^19.0.0",\
    "@vitejs/plugin-react": "^4.3.4",\
    "typescript": "^5.7.3",\
    "vite": "^6.0.7"\
  }\
}' > package.json

# 2. Instala as dependências (Agora o arquivo existe!)
RUN npm install --network-timeout=100000

# 3. Copia o restante do código (se houver algo no contexto)
COPY . .

# 4. Garante que os arquivos críticos existam (Recria se o contexto falhar)
# Nota: O build do Vite precisa encontrar o index.html e os fontes.
# Se você estiver usando o Easypanel apenas colando este Dockerfile, 
# o comando 'npm run build' pode falhar se os fontes não estiverem aqui.
# RECOMENDAÇÃO: Use o método Git no Easypanel para performance real.

RUN npm run build

# ESTÁGIO 2: Servidor de Produção
FROM nginx:stable-alpine

# Injeta configuração do Nginx
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    error_page 404 /index.html;\n\
}' > /etc/nginx/conf.d/default.conf

# Copia o resultado do build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]