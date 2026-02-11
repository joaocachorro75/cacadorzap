import { GoogleGenAI } from "@google/genai";
import { WhatsAppGroup } from "../types";

export interface StreamUpdate {
  group?: WhatsAppGroup;
  sources?: Array<{ title: string; uri: string }>;
  done?: boolean;
  error?: string;
}

export const huntGroupsStream = async (
  keyword: string, 
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `AJA COMO UM EXPLORADOR DE DADOS PROFISSIONAL. 
  Sua missão é localizar o MAIOR NÚMERO POSSÍVEL de links de convite ativos para grupos de WhatsApp sobre: "${keyword}".
  
  DIRETRIZES:
  1. Varra diretórios, fóruns, redes sociais e índices de 2024 e 2025.
  2. Procure por links no formato: https://chat.whatsapp.com/XXXXX.
  3. Seja EXAUSTIVO. Se existirem 50 links, encontre o máximo deles.
  4. Extraia apenas links de convite de GRUPOS (ignore wa.me individual).
  
  FORMATO DE RESPOSTA (OBRIGATÓRIO PARA CADA GRUPO):
  NOME: [Nome] | LINK: [URL] | DESC: [O que é] | CAT: [Categoria]
  
  Não escreva textos introdutórios, apenas a lista.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Extrair Grounding Chunks (URLs de pesquisa do Google)
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const sources = groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Fonte de Dados",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        const match = line.match(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9_-]{15,})/i);
        
        if (match) {
          const url = match[0].startsWith('http') ? match[0].trim() : `https://${match[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/NOME:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const catMatch = line.match(/CAT:\s*(.*)/i);

            onUpdate({
              group: {
                id: `wh-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Localizado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Encontrado via Radar To-Ligado.").trim(),
                category: (catMatch ? catMatch[1] : "Geral").trim(),
                status: 'verifying',
                relevanceScore: 100,
                verifiedAt: Date.now()
              }
            });
          }
        }
      }
    }
    onUpdate({ done: true });
  } catch (error: any) {
    console.error("Erro na busca:", error);
    onUpdate({ error: "Ocorreu um erro na busca. Verifique sua API_KEY no Easypanel.", done: true });
  }
};