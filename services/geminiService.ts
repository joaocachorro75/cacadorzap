import { GoogleGenAI } from "@google/genai";
import { WhatsAppGroup } from "../types";

export interface StreamUpdate {
  group?: WhatsAppGroup;
  sources?: Array<{ title: string; uri: string }>;
  done?: boolean;
  error?: string;
  rawError?: any;
}

/**
 * Motor de Busca Radar To-Ligado V15.5 - Diagnóstico Ativado
 */
export const huntGroupsStream = async (
  keyword: string, 
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  // O Vite injeta a variável via process.env configurada no vite.config.ts
  const apiKey = (process.env as any).API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    onUpdate({ 
      error: "ERRO DE AMBIENTE: A API_KEY não foi encontrada. Verifique as variáveis de ambiente no seu deploy.", 
      done: true 
    });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[SISTEMA DE INTERCEPTAÇÃO TO-LIGADO V15.5]
OBJETIVO: Extração MASSIVA de links de convite do WhatsApp (chat.whatsapp.com) para o tema: "${keyword}".

DIRETRIZES:
1. Pesquise por convites públicos recentes.
2. Retorne o nome do grupo e o link de convite.

FORMATO:
G:[NOME] | L:[LINK] | D:[DESCRIÇÃO]`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Menor temperatura = mais foco em fatos/links reais
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processar fontes para o HUD
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const sources = chunk.candidates[0].groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Fonte Detectada",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      const lines = fullText.split('\n');
      fullText = lines.pop() || ""; 

      for (const line of lines) {
        const urlMatch = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{12,}/i);
        
        if (urlMatch) {
          const url = `https://${urlMatch[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/G:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/D:\s*(.*?)\s*\|/i);

            onUpdate({
              group: {
                id: `wa-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Detectado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link interceptado via Radar Neural.").trim(),
                category: keyword,
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
    console.error("DEBUG RADAR:", error);
    
    let userFriendlyError = "FALHA NA INTERCEPTAÇÃO: ";
    
    if (error.message?.includes("API key not valid")) {
      userFriendlyError += "Sua API Key do Google Gemini é inválida ou expirou.";
    } else if (error.message?.includes("billing")) {
      userFriendlyError += "A ferramenta de busca exige um projeto com faturamento (billing) ativo no Google Cloud.";
    } else if (error.message?.includes("quota")) {
      userFriendlyError += "Limite de requisições atingido. Aguarde um momento.";
    } else {
      userFriendlyError += `Erro técnico: ${error.message || "Erro desconhecido"}`;
    }

    onUpdate({ error: userFriendlyError, rawError: error, done: true });
  }
};