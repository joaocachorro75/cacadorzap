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
    onUpdate({ error: "ERRO DE AUTENTICAÇÃO: Chave de API não localizada no ambiente seguro.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[PROTOCOLO DE EXTRAÇÃO RADAR TO-LIGADO V7]
OBJETIVO: Identificar convites ATIVOS de grupos do WhatsApp para o nicho: "${keyword}".

FONTES DE DADOS:
1. DIRETÓRIOS: Busque em whatsappgrupos.com, gruposwhats.app, linkdogrupo.com, reddit.com/r/WhatsAppGroups.
2. REDES: Varra perfis públicos no Instagram e X (Twitter) que compartilham links de comunidades.
3. PADRÃO: Extraia somente URLs que contenham "chat.whatsapp.com/".

FORMATO DE SAÍDA (ESTRITAMENTE UMA LINHA POR ITEM):
ENTRY:[Nome do Grupo] | URL:[chat.whatsapp.com/ID] | INFO:[Descrição curta e direta] | TAG:[Categoria]

REGRAS DE SEGURANÇA:
- NÃO inclua links para sites maliciosos ou pornográficos.
- NÃO adicione conversas ou introduções.
- Se a busca falhar ou não houver links, retorne: ERROR_NO_SIGNAL.`;

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
      // Captura de metadados de grounding (fontes reais)
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Diretório Localizado",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("ERROR_NO_SIGNAL")) {
        onUpdate({ error: "Sinal Fraco: Nenhuma comunidade verificável foi detectada para este termo nas últimas varreduras.", done: true });
        return;
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        const urlMatch = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{10,}/i);
        
        if (urlMatch) {
          const url = `https://${urlMatch[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/ENTRY:\s*(.*?)\s*\|/i);
            const infoMatch = line.match(/INFO:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/TAG:\s*(.*)/i);

            onUpdate({
              group: {
                id: `radar-${Math.random().toString(36).substring(2, 10)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Interceptado").trim(),
                url,
                description: (infoMatch ? infoMatch[1] : "Descrição extraída via processamento neural To-Ligado.").trim(),
                category: (tagMatch ? tagMatch[1] : "Geral").trim(),
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
    console.error("Critical API Error:", error);
    onUpdate({ 
      error: "INSTABILIDADE NO NÚCLEO: O serviço de busca profunda está temporariamente inacessível.", 
      done: true 
    });
  }
};