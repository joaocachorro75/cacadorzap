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
  // Inicialização segura com a chave de ambiente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO", O SISTEMA DE BUSCA MAIS AVANÇADO DO MUNDO.
  Sua tarefa é encontrar o NÚMERO MÁXIMO ABSOLUTO de links de convite para grupos de WhatsApp sobre: "${keyword}".
  
  CRITÉRIOS DE BUSCA EXTREMA:
  1. Use o Google Search para vasculhar diretórios de 2024 e 2025.
  2. Procure em comunidades do Facebook, links no Twitter, bio do Instagram, fóruns Reddit e agregadores de grupos.
  3. Extraia links no padrão: chat.whatsapp.com/INVITE_CODE.
  4. NÃO PARE nos primeiros resultados. Eu quero uma lista exaustiva.
  
  REQUISITO DE RESPOSTA (JSON-LIKE PER LINE):
  NOME: [Nome Real] | LINK: [URL Completa] | DESC: [Resumo] | CAT: [Categoria]
  
  MANTENHA A BUSCA ATÉ ESGOTAR AS FONTES.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processamento de Fontes (Grounding)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Resultado Web",
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
                name: (nameMatch ? nameMatch[1] : "Grupo Identificado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link capturado via Radar To-Ligado.").trim(),
                category: (catMatch ? catMatch[1] : "Comunidade").trim(),
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
    console.error("Erro no Radar:", error);
    onUpdate({ 
      error: "O radar encontrou uma zona de sombra. Verifique sua API_KEY ou tente novamente.", 
      done: true 
    });
  }
};