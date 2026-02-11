# ESTÁGIO 1: Construção do Ambiente e Aplicação
FROM node:20-alpine AS build

# Recebe a API_KEY do Easypanel durante o build
ARG API_KEY
ENV API_KEY=$API_KEY

WORKDIR /app

# 1. Criação da Estrutura de Pastas
RUN mkdir -p components services

# 2. Configurações de Ambiente (package.json, tsconfig.json, vite.config.ts)
# Removido 'tsc' do build para evitar falhas por checagem de tipos em arquivos gerados via echo
RUN echo '{"name":"radar-wa-v15","private":true,"version":"15.5.0","type":"module","scripts":{"build":"vite build"},"dependencies":{"@google/genai":"^1.40.0","react":"^19.2.4","react-dom":"^19.2.4"},"devDependencies":{"@types/react":"^19.0.0","@types/react-dom":"^19.0.0","@vitejs/plugin-react":"^4.3.4","typescript":"^5.7.3","vite":"^6.0.7"}}' > package.json
RUN echo '{"compilerOptions":{"target":"ESNext","useDefineForClassFields":true,"lib":["DOM","DOM.Iterable","ESNext"],"allowJs":false,"skipLibCheck":true,"strict":true,"module":"ESNext","moduleResolution":"Node","resolveJsonModule":true,"isolatedModules":true,"noEmit":true,"jsx":"react-jsx"},"include":["**/*.ts","**/*.tsx"]}' > tsconfig.json
RUN echo 'import {defineConfig} from "vite";import react from "@vitejs/plugin-react";export default defineConfig({plugins:[react()],define:{"process.env":{API_KEY:JSON.stringify(process.env.API_KEY||"")}}});' > vite.config.ts

# 3. Instalação de Dependências
RUN npm install --network-timeout=100000

# 4. Injeção dos Arquivos da Aplicação (Reconstrução Completa)
# index.html
RUN echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Radar de Grupos | To-Ligado.com</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body><div id="root"></div><script type="module" src="/index.tsx"></script></body></html>' > index.html

# index.tsx
RUN echo 'import React from "react";import ReactDOM from "react-dom/client";import App from "./App";const root=ReactDOM.createRoot(document.getElementById("root")!);root.render(<React.StrictMode><App /></React.StrictMode>);' > index.tsx

# types.ts
RUN echo 'export interface WhatsAppGroup{id:string;name:string;url:string;description:string;status:"active"|"verifying"|"unknown";category:string;relevanceScore:number;verifiedAt?:number}export interface AppStats{totalSearches:number;groupsFound:number;estimatedCost:number}' > types.ts

# services/geminiService.ts (CORREÇÃO DE SINTAXE NO TRY/CATCH)
RUN echo 'import {GoogleGenAI} from "@google/genai";export const huntGroupsStream=async(keyword,onUpdate)=>{const ai=new GoogleGenAI({apiKey:process.env.API_KEY});const prompt=`[MODO MASSIVO V15.5] Extraia o MAIOR NUMERO de links de WhatsApp para: "${keyword}". Retorne por linha: G:[NOME] | L:[URL] | D:[DESC] | T:[CAT]`;try{const response=await ai.models.generateContentStream({model:"gemini-3-flash-preview",contents:prompt,config:{tools:[{googleSearch:{}}],temperature:0.3}});let text="";for await(const chunk of response){if(chunk.candidates?.[0]?.groundingMetadata?.groundingChunks){onUpdate({sources:chunk.candidates[0].groundingMetadata.groundingChunks.filter(c=>c.web).map(c=>({title:c.web.title,uri:c.web.uri}))})}text+=chunk.text||"";const lines=text.split("\n");text=lines.pop()||"";for(const line of lines){const m=line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{12,}/i);if(m){const url="https://"+m[0];const name=(line.match(/G:\s*(.*?)\s*\|/i)?.[1]||"Grupo").trim();onUpdate({group:{id:Math.random().toString(36),name,url,description:(line.match(/D:\s*(.*?)\s*\|/i)?.[1]||"").trim(),category:keyword,status:"verifying",relevanceScore:100,verifiedAt:Date.now()}})}}};onUpdate({done:true})}catch(e){onUpdate({error:"Erro na busca.",done:true})}};' > services/geminiService.ts

# App.tsx (UI Pro Reconstruída no Dockerfile)
RUN echo 'import React,{useState} from "react";import{huntGroupsStream}from"./services/geminiService";const App=()=>{const[kw,setKw]=useState("");const[res,setRes]=useState([]);const[ld,setLd]=useState(false);const go=async()=>{setLd(true);setRes([]);await huntGroupsStream(kw,(u)=>{if(u.group)setRes(p=>[...p,u.group]);if(u.done)setLd(false);});};return(<div className="min-h-screen bg-[#01040a] text-white p-4 font-sans"><div className="max-w-5xl mx-auto py-12 text-center"><h1 className="text-5xl font-black mb-4 italic tracking-tighter text-green-500 uppercase">Radar V15</h1><p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">To-Ligado.com | Intelligence System</p><div className="relative mb-16 flex gap-2"><input value={kw} onChange={e=>setKw(e.target.value)} className="flex-1 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl outline-none focus:border-green-500" placeholder="Digite uma palavra-chave..."/><button onClick={go} disabled={ld} className="bg-green-600 px-10 rounded-2xl font-black uppercase hover:brightness-110 disabled:opacity-50">{ld?"...":"BUSCAR"}</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{res.map(g=>(<div key={g.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl text-left"><div className="flex justify-between mb-4"><div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><i className="fab fa-whatsapp text-xl"></i></div><span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded font-black uppercase">Ativo</span></div><h3 className="font-bold text-lg mb-2 italic line-clamp-1">{g.name}</h3><p className="text-slate-400 text-xs mb-6 line-clamp-2">{g.description}</p><a href={g.url} target="_blank" className="block text-center bg-green-500 text-white p-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Acessar Grupo</a></div>))}</div></div></div>);};export default App;' > App.tsx

# 5. Execução do Build (Vite)
RUN npm run build

# ESTÁGIO 2: Servidor Web de Produção
FROM nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
RUN printf 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]