import { GoogleGenAI } from "@google/genai";
import { WhatsAppGroup } from "../types";

export interface StreamUpdate {
  group?: WhatsAppGroup;
  sources?: Array<{ title: string; uri: string }>;
  done?: boolean;
  error?: string;
}

/**
 * Motor de Busca To-Ligado V15.0 - Massive Extraction Mode
 * Focado em volume máximo e varredura em tempo real.
 */
export const huntGroupsStream = async (
  keyword: string, 
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    onUpdate({ error: "ERRO CRÍTICO: Chave de API ausente. Verifique as configurações.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[EXTRATOR MASSIVO TO-LIGADO V15.0 - OPERAÇÃO BLACKOUT]
OBJETIVO: Interceptar o volume MÁXIMO de links de convite (chat.whatsapp.com) para: "${keyword}".

DIRETRIZES DE VARREDURA:
1. Procure em agregadores públicos, redes sociais, fóruns, diretórios de grupos e caches de busca.
2. Extraia o maior número de links ÚNICOS possível. Tente retornar entre 60 a 100 resultados se disponíveis.
3. Priorize links de convite diretos.

FORMATO DE RESPOSTA (ESTRITO - UMA LINHA POR GRUPO):
ID:[Identificador] | G:[Nome do Grupo] | L:[URL chat.whatsapp.com] | D:[Descricao] | T:[Categoria]

REGRAS RÍGIDAS:
- Sem conversa ou introdução.
- Apenas links reais de convite.
- Se houver poucos resultados, tente expandir a busca para nichos relacionados.
- Se nada for detectado: STATUS_NO_SIGNALS.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.15, // Levemente maior para permitir que a IA explore mais caminhos de busca
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processamento de Grounding (Fontes de onde os dados vieram)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Diretório Interceptado",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("STATUS_NO_SIGNALS")) {
        onUpdate({ error: "O radar não detectou sinais públicos para esta frequência.", done: true });
        return;
      }

      // Parser de Linhas para Streaming em tempo real
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
            const tagMatch = line.match(/T:\s*(.*)/i);

            onUpdate({
              group: {
                id: `wa-${Math.random().toString(36).substring(2, 10)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Interceptado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link detectado via varredura profunda To-Ligado.").trim(),
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
    console.error("Erro na varredura massiva:", error);
    onUpdate({ 
      error: "INSTABILIDADE NO RADAR: O fluxo de dados foi bloqueado por ruído excessivo. Tente novamente em instantes.", 
      done: true 
    });
  }
};