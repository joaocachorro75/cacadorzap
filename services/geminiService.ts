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
    onUpdate({ error: "FALHA DE SISTEMA: Chave de API ausente na infraestrutura To-Ligado.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `ATUAR COMO O "RADAR TO-LIGADO V3" (EXTRATOR DE DADOS DE ALTA PRECISÃO).

MISSÃO: Localizar links de convite ATIVOS e RECENTES (2024-2025) para grupos de WhatsApp sobre "${keyword}".

PROTOCOLOS DE BUSCA:
1. PESQUISA PROFUNDA: Utilize o Google Search para varrer diretórios de grupos (ex: whatsappgrupos.com, gruposwhats.app), postagens em redes sociais (Twitter, Instagram Bio, Facebook), fóruns (Reddit, Quora) e comunidades segmentadas.
2. FILTRAGEM DE ELITE: Capture APENAS links no formato exato 'chat.whatsapp.com/INVITE_CODE'. Ignore links 'wa.me'.
3. VERIFICAÇÃO DE RELEVÂNCIA: Priorize grupos com nomes claros e descrições úteis.

FORMATO DE RESPOSTA (ESTRITAMENTE UMA LINHA POR RESULTADO):
NOME: [Nome Curto] | LINK: [URL chat.whatsapp.com/...] | DESC: [Resumo objetivo] | CAT: [Nicho exato]

REGRAS CRÍTICAS:
- PROIBIDO saudações, explicações ou "Aqui estão os grupos".
- APENAS dados brutos. 
- Se a varredura falhar, responda: "STATUS: SINAL_NAO_DETECTADO".`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 1024 }
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processamento de Grounding Metadata (Fontes reais da busca)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Portal de Indexação",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SINAL_NAO_DETECTADO")) {
        onUpdate({ error: "O Radar não captou sinais ativos para este termo nos satélites públicos.", done: true });
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
                name: (nameMatch ? nameMatch[1] : "Comunidade Identificada").trim(),
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
    console.error("Critical Engine Failure:", error);
    onUpdate({ 
      error: "SINAL INTERROMPIDO: O Radar To-Ligado encontrou uma barreira na varredura. Tente simplificar a palavra-chave.", 
      done: true 
    });
  }
};