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
    onUpdate({ error: "SISTEMA BLOQUEADO: Credenciais de busca não identificadas no servidor.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[RADAR TO-LIGADO INTELLIGENCE V8.0]
COMANDO: Localizar comunidades ATIVAS do WhatsApp para: "${keyword}".

PROTOCOLO DE RASTREAMENTO:
1. NÚCLEO WEB: Extraia convites de diretórios (whatsappgrupos.com, linkdogrupo.com, gruposwhats.app).
2. INTELIGÊNCIA SOCIAL: Procure em posts recentes do Reddit, Twitter e Facebook.
3. FILTRAGEM: Apenas links chat.whatsapp.com/[InviteCode] válidos.
4. METADADOS: Capture nome real, categoria e uma descrição concisa do objetivo.

ESTRUTURA DE SAÍDA (OBRIGATÓRIO):
DATA:[Nome] | LINK:[URL] | DESC:[Resumo] | TAG:[Categoria]

REGRAS DE EXECUÇÃO:
- Proibido qualquer texto extra além da estrutura DATA.
- Proibido repetir links já encontrados.
- Se não houver sinal claro após varredura profunda, retorne: SIGNAL_LOSS_TOTAL.`;

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

      if (fullText.includes("SIGNAL_LOSS_TOTAL")) {
        onUpdate({ error: "Frequência Inativa: O radar não detectou comunidades públicas recentes com este termo.", done: true });
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
            
            const nameMatch = line.match(/DATA:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/TAG:\s*(.*)/i);

            onUpdate({
              group: {
                id: `track-${Math.random().toString(36).substring(2, 11)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Localizada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link interceptado via rede de inteligência artificial To-Ligado.").trim(),
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
    console.error("Critical Engine Failure:", error);
    onUpdate({ 
      error: "ANOMALIA NO NÚCLEO: Houve uma sobrecarga no sistema de busca profunda. Tente novamente.", 
      done: true 
    });
  }
};