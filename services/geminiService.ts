import { GoogleGenAI } from "@google/genai";
import { WhatsAppGroup } from "../types";

export interface StreamUpdate {
  group?: WhatsAppGroup;
  sources?: Array<{ title: string; uri: string }>;
  done?: boolean;
  error?: string;
}

/**
 * Motor de Busca Radar To-Ligado V15.5
 */
export const huntGroupsStream = async (
  keyword: string, 
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  // O Vite injeta a variável via process.env configurada no vite.config.ts
  const apiKey = (process.env as any).API_KEY;
  
  if (!apiKey || apiKey === "") {
    onUpdate({ error: "ERRO CRÍTICO: Chave API não detectada no ambiente de build.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[SISTEMA DE INTERCEPTAÇÃO TO-LIGADO V15.5]
OBJETIVO: Extração MASSIVA de links de convite do WhatsApp para: "${keyword}".

DIRETRIZES:
1. Varra a web em busca de diretórios de grupos e convites públicos.
2. Identifique o máximo possível de links reais (chat.whatsapp.com/...).
3. Ignore links quebrados ou repetidos.

FORMATO DE RETORNO (BRUTO):
G:[NOME DO GRUPO] | L:[LINK COMPLETO] | D:[DESCRICAO CURTA] | T:[CATEGORIA]

Retorne apenas os dados, sem explicações.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
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
                name: (nameMatch ? nameMatch[1] : "Grupo Encontrado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Extraído via Radar Neural To-Ligado.").trim(),
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
    onUpdate({ error: "SINAL INTERROMPIDO: Tente uma palavra-chave diferente ou verifique sua API Key.", done: true });
  }
};