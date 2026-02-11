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
  
  // Prompt otimizado para extração massiva e diversificada
  const prompt = `[SISTEMA DE INTERCEPTAÇÃO TO-LIGADO V15.5 - MODO MASSIVO]
OBJETIVO: Extração do MAIOR NÚMERO POSSÍVEL de links de convite do WhatsApp para: "${keyword}".

REQUISITOS DE VOLUME:
1. Não pare nos primeiros resultados. Explore diretórios de grupos, postagens de redes sociais e logs de chats.
2. Identifique variações de convites (chat.whatsapp.com/INVITE_CODE).
3. Busque por termos relacionados para ampliar o alcance se os resultados diretos forem escassos.

FORMATO DE RETORNO (RIGOROSO):
Uma linha por grupo encontrado seguindo este padrão:
G:[NOME DO GRUPO] | L:[LINK COMPLETO] | D:[DESCRICAO BREVE] | T:[CATEGORIA]

NÃO ADICIONE TEXTO DE INTRODUÇÃO OU CONCLUSÃO. APENAS OS DADOS BRUTOS.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Um pouco mais de temperatura para diversidade de busca
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processamento de Grounding para transparência de fontes
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
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
        // Regex aprimorada para detectar links de convite
        const urlMatch = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{12,}/i);
        
        if (urlMatch) {
          const url = `https://${urlMatch[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/G:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/D:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/T:\s*(.*?)$/i);

            onUpdate({
              group: {
                id: `wa-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Radar").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Encontrado via varredura neural profunda.").trim(),
                category: (tagMatch ? tagMatch[1] : keyword).trim(),
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