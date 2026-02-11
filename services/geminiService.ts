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
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    onUpdate({ error: "ERRO CRÍTICO: Chave de API não configurada no servidor Radar.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO V5" - MOTOR DE INTELIGÊNCIA EM COMUNIDADES.
MISSÃO: Localizar links de convite ATIVOS e VERIFICADOS para o tema: "${keyword}".

PROTOCOLO DE OPERAÇÃO:
1. USE GOOGLE SEARCH para varrer diretórios (ex: whatsappgrupos.com, gruposwhats.app, reddit), redes sociais (Instagram, Twitter, Facebook) e fóruns.
2. EXTRAIA APENAS links que sigam o padrão exato: chat.whatsapp.com/INVITE_CODE.
3. FILTRAGEM: Ignore sites de notícias ou artigos que não contenham convites diretos.

FORMATO DE RESPOSTA (UMA LINHA POR GRUPO):
NOME: [Nome do Grupo] | LINK: [URL chat.whatsapp.com/...] | DESC: [Resumo objetivo] | CAT: [Nicho Específico]

REGRAS DE OURO:
- NÃO adicione introduções como "Aqui estão os resultados".
- NÃO adicione conclusões.
- Se não encontrar nada, responda estritamente: "SINAL_ZERO_DETECTADO".`;

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
      // Captura de fontes (Grounding)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Fonte do Radar",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SINAL_ZERO_DETECTADO")) {
        onUpdate({ error: "O Radar não captou sinais de grupos ativos para este termo nos satélites públicos.", done: true });
        return;
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
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
                name: (nameMatch ? nameMatch[1] : "Grupo Encontrado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Extraído via varredura profunda To-Ligado.").trim(),
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
    console.error("Critical Failure:", error);
    onUpdate({ 
      error: "SINAL INTERROMPIDO: Interferência na conexão com os satélites To-Ligado.", 
      done: true 
    });
  }
};