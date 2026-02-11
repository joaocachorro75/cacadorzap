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
    onUpdate({ error: "ERRO DE AUTENTICAÇÃO: A infraestrutura To-Ligado requer uma chave de API válida para habilitar o processamento neural de busca profunda.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[PROTOCOLO RADAR TO-LIGADO V10.0]
OBJETIVO: Localização tática de comunidades ATIVAS no WhatsApp para o nicho específico: "${keyword}".

ESTRATÉGIA DE BUSCA:
1. INDEXAÇÃO WEB: Explore diretórios de alta densidade (whatsappgrupos.com, linkdogrupo.com, gruposwhats.app).
2. INTELIGÊNCIA EM REDES: Varra metadados de posts recentes no X (Twitter), Reddit e Facebook que contenham links chat.whatsapp.com.
3. FILTRAGEM DE ELITE: Capture apenas links que demonstrem atividade recente e relevância direta com o termo "${keyword}".

FORMATO DE SAÍDA (ESTRITAMENTE UMA LINHA POR REGISTRO):
ENTRY:[Nome do Grupo] | LINK:[URL] | DESC:[Resumo Tático de 10 palavras] | TAG:[Categoria de Nicho]

REGRAS DE SEGURANÇA E FORMATO:
- NÃO inclua qualquer texto introdutório ou explicativo.
- NÃO repita registros.
- Caso a varredura não detecte sinais compatíveis, retorne estritamente: "SIGNAL_LOST_TOTAL".`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.15,
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
            title: c.web.title || "Fonte de Dados",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_LOST_TOTAL")) {
        onUpdate({ error: "Nenhum Sinal: O radar varreu os satélites de dados, mas não encontrou comunidades ativas para este termo no momento.", done: true });
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
                id: `track-v10-${Math.random().toString(36).substring(2, 11)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Interceptada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Descrição extraída via processamento neural de alta fidelidade To-Ligado.").trim(),
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
      error: "ANOMALIA NO SISTEMA: Houve uma interrupção crítica no motor de busca neural. Tente reiniciar a varredura.", 
      done: true 
    });
  }
};