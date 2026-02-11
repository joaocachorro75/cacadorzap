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
    onUpdate({ error: "CONEXÃO NEGADA: O Radar To-Ligado requer uma chave de autenticação válida para operar.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `SISTEMA DE INTERCEPÇÃO DE DADOS PÚBLICOS - RADAR TO-LIGADO V6.
ALVO: Links de convite de grupos de WhatsApp sobre: "${keyword}".

DIRETRIZES DE MINERAÇÃO:
1. PESQUISA: Varra ativamente diretórios de indexação de grupos (ex: whatsappgrupos.com, gruposwhats.app, linkdogrupo.com), redes sociais (X/Twitter, Instagram, Reddit) e fóruns de nicho.
2. FILTRO: Capture EXCLUSIVAMENTE links no formato chat.whatsapp.com/INVITE_CODE.
3. CONTEÚDO: Identifique o nome do grupo e uma breve descrição do propósito.

ESTRUTURA DE RESPOSTA OBRIGATÓRIA (UMA POR LINHA):
GRUPO:[Nome] | LINK:[URL Completa] | DESC:[Breve resumo] | CAT:[Categoria de Nicho]

RESTRIÇÕES SEVERAS:
- PROIBIDO introduções, comentários ou saudações.
- PROIBIDO repetir links.
- Se não houver detecção clara, retorne apenas: "SINAL_INEXISTENTE".`;

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
      // Processamento de Grounding (Fontes)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Diretório Web",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SINAL_INEXISTENTE")) {
        onUpdate({ error: "O Radar não encontrou comunidades ativas para este termo nas redes públicas no momento.", done: true });
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
            
            const nameMatch = line.match(/GRUPO:\s*\[?(.*?)\]?\s*\|/i);
            const descMatch = line.match(/DESC:\s*\[?(.*?)\]?\s*\|/i);
            const catMatch = line.match(/CAT:\s*\[?(.*?)\]?$/i);

            onUpdate({
              group: {
                id: `wh-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Detectada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link interceptado via motor de busca profunda To-Ligado.").trim(),
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
    console.error("Critical Radar Failure:", error);
    onUpdate({ 
      error: "INSTABILIDADE DE SINAL: Houve uma falha na comunicação com os satélites de busca. Tente novamente.", 
      done: true 
    });
  }
};