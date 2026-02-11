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
    onUpdate({ error: "ERRO DE SISTEMA: Chave de API não localizada nas variáveis de ambiente.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO" - MOTOR DE BUSCA DE COMUNIDADES.
ALVO: Links de convite ativos para grupos de WhatsApp sobre: "${keyword}".

PROTOCOLO DE EXTRAÇÃO:
1. Varra diretórios, fóruns, redes sociais e índices de grupos de 2024 e 2025.
2. Identifique URLs que seguem o padrão: chat.whatsapp.com/INVITE_CODE.
3. GERE EXCLUSIVAMENTE DADOS ESTRUTURADOS. NADA DE CONVERSA.

FORMATO DE SAÍDA (UMA LINHA POR GRUPO):
NOME: [Nome do Grupo] | LINK: [URL chat.whatsapp.com/...] | DESC: [Resumo do propósito] | CAT: [Categoria]

REGRAS:
- Não inclua saudações.
- Se não encontrar nada, responda: "STATUS: SINAL_ZUMBI".`;

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
      // Extração de Grounding (Fontes)
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

      if (fullText.includes("SINAL_ZUMBI")) {
        onUpdate({ error: "O Radar To-Ligado não encontrou sinais ativos para este termo.", done: true });
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
                name: (nameMatch ? nameMatch[1] : "Grupo Identificado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Capturado via Varredura To-Ligado.").trim(),
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
    console.error("Critical Radar Error:", error);
    onUpdate({ 
      error: "ERRO DE CONEXÃO: O satélite To-Ligado falhou ao processar a requisição.", 
      done: true 
    });
  }
};