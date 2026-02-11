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
  // Inicialização robusta usando a variável injetada pelo Vite
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    onUpdate({ error: "ERRO DE INFRAESTRUTURA: Chave de API não detectada no ambiente To-Ligado.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO V4" - PROTOCOLO DE MINERAÇÃO DE ALTA PRECISÃO.

OBJETIVO: Interceptar links de convite ATIVOS e VERIFICADOS para grupos de WhatsApp sobre "${keyword}".

DIRETRIZES TÉCNICAS:
1. PESQUISA: Utilize o Google Search para indexar diretórios de grupos, fóruns, redes sociais e postagens recentes (2024-2025).
2. FILTRO: Capture APENAS URLs que contenham 'chat.whatsapp.com/'. Ignore qualquer outro tipo de link.
3. SAÍDA: Gere EXCLUSIVAMENTE os dados estruturados abaixo, uma linha por grupo.

FORMATO OBRIGATÓRIO (NÃO ADICIONE MAIS NADA):
NOME: [Nome do Grupo] | LINK: [URL chat.whatsapp.com/...] | DESC: [Propósito do grupo] | CAT: [Nicho]

RESTRIÇÕES CRÍTICAS:
- PROIBIDO saudações (ex: "Aqui estão os links...").
- PROIBIDO comentários.
- Se não houver sinais detectados, responda exatamente: "STATUS_SINAL: ZUMBI".`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } // Respostas rápidas e diretas
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Captura de metadados de grounding (fontes reais)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Repositório Web",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("STATUS_SINAL: ZUMBI")) {
        onUpdate({ error: "O Radar To-Ligado não detectou sinais ativos para este termo nos satélites públicos.", done: true });
        return;
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        // Regex aprimorada para detectar o link de convite em qualquer parte da linha
        const match = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{15,}/i);
        
        if (match) {
          const url = `https://${match[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/NOME:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const catMatch = line.match(/CAT:\s*(.*)/i);

            onUpdate({
              group: {
                id: `wh-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Interceptada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Intercepção via motor de busca To-Ligado.").trim(),
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
    console.error("Critical Engine Error:", error);
    onUpdate({ 
      error: "CONEXÃO PERDIDA: Interferência solar detectada. Verifique sua conexão ou tente novamente mais tarde.", 
      done: true 
    });
  }
};