
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
    onUpdate({ error: "ERRO DE CREDENCIAIS: Chave de API não detectada.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prompt de Força Bruta Otimizado para Gemini 3 Flash
  // Instruímos o modelo a ser exaustivo e focar puramente em links de convite.
  const prompt = `[PROTOCOLO DE EXTRAÇÃO MASSIVA V14.0]
ALVO: Links de convite de WhatsApp (chat.whatsapp.com) para o nicho: "${keyword}".

DIRETRIZES TÁTICAS PARA O MODELO:
1. Realize uma busca profunda em agregadores de links, fóruns de nicho, redes sociais e diretórios de grupos.
2. Extraia CADA link de convite único encontrado.
3. Não pare na primeira página de resultados; tente compilar uma lista de pelo menos 50 a 80 grupos se disponíveis na rede pública.
4. Ignore grupos repetidos.

FORMATO DE RESPOSTA OBRIGATÓRIO (UM POR LINHA):
G:[Nome do Grupo] | L:[URL chat.whatsapp.com] | D:[Breve descrição/contexto] | T:[Categoria]

REGRAS RÍGIDAS:
- Apenas links reais e ativos de chat.whatsapp.com.
- Proibido texto de introdução, saudação ou conclusão.
- Se a densidade de resultados for baixa, procure termos correlatos para aumentar o volume.
- Se falhar totalmente: SIGNAL_LOST_000.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Baixa temperatura para manter a rigidez do formato de lista
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
            title: c.web.title || "Repositório de Dados",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_LOST_000")) {
        onUpdate({ error: "O radar não encontrou sinais suficientes. Tente uma palavra-chave mais abrangente.", done: true });
        return;
      }

      // Parser de Linha para Streaming Real-time
      const lines = fullText.split('\n');
      fullText = lines.pop() || ""; 

      for (const line of lines) {
        // Captura agressiva de links em qualquer formato na linha
        const urlMatch = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{15,}/i);
        
        if (urlMatch) {
          const url = `https://${urlMatch[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/G:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/D:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/T:\s*(.*)/i);

            onUpdate({
              group: {
                id: `wa-${Math.random().toString(36).substring(2, 12)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Identificado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Encontrado através de varredura profunda To-Ligado.").trim(),
                category: (tagMatch ? tagMatch[1] : keyword).trim(),
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
    console.error("Erro na busca massiva:", error);
    onUpdate({ 
      error: "CONEXÃO INSTÁVEL: O fluxo de dados foi interrompido. Reinicie a busca para estabilizar o radar.", 
      done: true 
    });
  }
};
