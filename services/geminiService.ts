import { GoogleGenAI } from "@google/genai";
import { WhatsAppGroup } from "../types";

export interface StreamUpdate {
  group?: WhatsAppGroup;
  sources?: Array<{ title: string; uri: string }>;
  done?: boolean;
  error?: string;
}

/**
 * Motor de Busca To-Ligado V15.5 - Ultra Stealth Extraction (MAX VOLUME)
 */
export const huntGroupsStream = async (
  keyword: string, 
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    onUpdate({ error: "ERRO: Chave API não configurada no ambiente.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[SISTEMA DE INTERCEPTAÇÃO TO-LIGADO V15.5 - MODO MASSIVO]
OBJETIVO: Extração do MAIOR NÚMERO POSSÍVEL de links de convite do WhatsApp para: "${keyword}".

ESTRATÉGIA DE BUSCA:
1. Analise diretórios, blogs, redes sociais (Twitter, Instagram, Facebook) e fóruns.
2. Busque por variações como "link de grupo", "zap zap", "whatsapp invitation".
3. Tente encontrar pelo menos 50 links reais de convite (chat.whatsapp.com).

FORMATO DE RETORNO (OBRIGATÓRIO):
Retorne cada grupo em uma linha nova usando exatamente este formato:
G:[NOME DO GRUPO] | L:[LINK DE CONVITE COMPLETO] | D:[DESCRICAO] | T:[CATEGORIA]

SEM TEXTO ADICIONAL. APENAS OS DADOS BRUTOS.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Extração de fontes para o HUD
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
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
                description: (descMatch ? descMatch[1] : "Interceptado via Radar To-Ligado.").trim(),
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
    onUpdate({ error: "SINAL INSTÁVEL: O motor de busca encontrou uma barreira. Tente novamente.", done: true });
  }
};