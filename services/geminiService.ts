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
    onUpdate({ error: "ACESSO NEGADO: O motor neural To-Ligado requer uma chave de autenticação ativa para realizar varreduras profundas.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[RADAR TO-LIGADO INTELLIGENCE V9.0]
PRIORIDADE: MÁXIMA.
ALVO: Interceptar convites ATIVOS, PÚBLICOS e VERIFICÁVEIS de grupos do WhatsApp para o nicho: "${keyword}".

DIRETRIZES OPERACIONAIS:
1. RASTREAMENTO PROFUNDO: Varra diretórios globais (whatsappgrupos.com, gruposwhats.app, linkdogrupo.com) e indexadores de links em redes sociais (Twitter/X, Reddit).
2. EXTRAÇÃO DE ALTA PRECISÃO: Capture apenas links com padrão chat.whatsapp.com/INVITE_ID.
3. ENRIQUECIMENTO DE DADOS: Identifique o nome real do grupo, categoria de nicho e um resumo tático das atividades permitidas na comunidade.

FORMATO DE RESPOSTA OBRIGATÓRIO (UMA LINHA POR REGISTRO):
ENTRY:[Nome do Grupo] | LINK:[URL Completa] | DESC:[Resumo Tático] | TAG:[Nicho Específico]

LIMITAÇÕES TÉCNICAS:
- PROIBIDO introduções, avisos ou qualquer texto fora do formato ENTRY.
- PROIBIDO repetir links.
- Se nenhuma comunidade funcional for localizada, retorne estritamente: "SIGNAL_LOST_TOTAL".`;

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
            title: c.web.title || "Satélite de Dados",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_LOST_TOTAL")) {
        onUpdate({ error: "Falha de Sincronia: O radar varreu as frequências públicas, mas não detectou comunidades ativas compatíveis com este critério agora.", done: true });
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
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/TAG:\s*(.*)/i);

            onUpdate({
              group: {
                id: `radar-v90-${Math.random().toString(36).substring(2, 11)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Interceptada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link interceptado via rede de inteligência artificial de alto nível To-Ligado.").trim(),
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
      error: "ANOMALIA NO NÚCLEO: O sistema de busca profunda encontrou uma barreira de comunicação com os satélites de busca. Reinicie o radar.", 
      done: true 
    });
  }
};