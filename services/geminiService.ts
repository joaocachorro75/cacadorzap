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
    onUpdate({ error: "ERRO DE CREDENCIAIS: O sistema não conseguiu validar sua chave de acesso To-Ligado. Por favor, tente novamente mais tarde.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[PROTOCOLO ELITE RADAR V11.0]
ALVO: Interceptar links de convite ativos (chat.whatsapp.com) focados no nicho: "${keyword}".

DIRETIVAS OPERACIONAIS:
1. VARREDURA GLOBAL: Explore diretórios de alta densidade como whatsappgrupos.com, linkdogrupo.com e agregadores de redes sociais.
2. EXTRAÇÃO TÁTICA: Identifique o nome oficial do grupo, uma descrição funcional e sua categoria principal.
3. FILTRAGEM DE PRECISÃO: Capture apenas links que correspondam ao padrão de convite do WhatsApp.

FORMATO DE RESPOSTA (UMA LINHA POR REGISTRO):
ENTRY:[Nome do Grupo] | LINK:[URL] | DESC:[Resumo de 12 palavras] | TAG:[Categoria]

REGRAS:
- PROIBIDO incluir introduções ou avisos.
- PROIBIDO repetir links.
- Se não houver sinais ativos, retorne: "SIGNAL_LOST_TOTAL".`;

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
            title: c.web.title || "Fonte Detectada",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_LOST_TOTAL")) {
        onUpdate({ error: "Sinal Interrompido: Nenhuma comunidade verificada foi localizada nos radares públicos para este termo.", done: true });
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
                id: `radar-ext-${Math.random().toString(36).substring(2, 10)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Localizado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Descrição interceptada via motor de inteligência artificial To-Ligado.").trim(),
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
    console.error("Critical Failure:", error);
    onUpdate({ 
      error: "FALHA DE SINCRONIA: Tivemos um problema ao conectar com a rede de busca global. Reinicie o radar.", 
      done: true 
    });
  }
};