# ESTÁGIO 1: Build do Ambiente (Node.js)
FROM node:20-alpine AS build

WORKDIR /app

# 1. Criação da estrutura de pastas
RUN mkdir -p src/components src/services

# 2. Reconstrução do package.json
RUN echo '{\
  "name": "radar-whatsapp-v15",\
  "private": true,\
  "version": "15.5.0",\
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

# 3. Reconstrução do tsconfig.json
RUN echo '{\
  "compilerOptions": {\
    "target": "ESNext",\
    "useDefineForClassFields": true,\
    "lib": ["DOM", "DOM.Iterable", "ESNext"],\
    "allowJs": false,\
    "skipLibCheck": true,\
    "esModuleInterop": false,\
    "allowSyntheticDefaultImports": true,\
    "strict": true,\
    "forceConsistentCasingInFileNames": true,\
    "module": "ESNext",\
    "moduleResolution": "Node",\
    "resolveJsonModule": true,\
    "isolatedModules": true,\
    "noEmit": true,\
    "jsx": "react-jsx"\
  },\
  "include": ["./src/**/*.ts", "./src/**/*.tsx", "./*.ts", "./*.tsx"],\
  "exclude": ["node_modules"]\
}' > tsconfig.json

# 4. Reconstrução do vite.config.ts
RUN echo 'import { defineConfig } from "vite";\
import react from "@vitejs/plugin-react";\
export default defineConfig({\
  plugins: [react()],\
  define: {\
    "process.env": { API_KEY: JSON.stringify(process.env.API_KEY || "") }\
  },\
  build: { outDir: "dist", emptyOutDir: true }\
});' > vite.config.ts

# 5. Instalação de dependências (agora os arquivos existem)
RUN npm install --network-timeout=100000

# 6. Reconstrução dos arquivos fonte (CRITICAL: index.html deve estar na raiz para o Vite)
# Nota: Como o usuário está enviando as mudanças via XML, eu vou gerar o Dockerfile que espera os arquivos.
# Mas para garantir que o erro "Could not resolve entry module index.html" suma:
# Vou forçar a cópia do contexto se ele existir, ou avisar.
# Se o build falha aqui, é porque o usuário não subiu os arquivos App.tsx etc para o servidor.

COPY . .

# Caso os arquivos não tenham sido copiados (contexto vazio no Easypanel), 
# este comando vai falhar. Mas como eu enviei os arquivos no XML anterior,
# o Easypanel DEVERIA ter esses arquivos se estiver conectado ao Git.
# Se estiver colando APENAS o Dockerfile, o comando abaixo garante o index.html:

RUN [ -f index.html ] || echo '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module" src="/index.tsx"></script></body></html>' > index.html

RUN npm run build

# ESTÁGIO 2: Servidor Web (Nginx)
FROM nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
RUN printf 'server {\n    listen 80;\n    server_name localhost;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}' > /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]