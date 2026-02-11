
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prompt de Busca Profunda para maximizar resultados
  const prompt = `Aja como um Mega Crawler de Links de WhatsApp. Sua missão é encontrar o MAIOR NÚMERO POSSÍVEL de links de convite (chat.whatsapp.com) sobre: "${keyword}".
  
  ESTRATÉGIA DE BUSCA:
  1. Varra sites de diretórios (como grupos.vqv.com.br, linkwhats, etc.), grupos de Facebook, Bio de Instagram, fóruns e postagens de 2024/2025.
  2. Use operadores de busca interna para achar páginas que listam coleções de grupos.
  3. NÃO se limite aos primeiros resultados. Extraia pelo menos 30-40 links se disponíveis.
  
  FILTRO DE ATIVAÇÃO:
  - Só retorne links que pareçam ser de grupos de conversa ativos.
  - Ignore links para perfis individuais (wa.me).
  
  FORMATO DE RESPOSTA (OBRIGATÓRIO):
  NOME: [nome] | LINK: [url] | DESC: [desc] | CAT: [cat]
  
  Gere uma lista longa. Se houver muitos grupos, liste todos sem medo de ser prolixo.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Menor temperatura = mais foco em fatos/links reais
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;

      // Captura de Fontes (Grounding)
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const sources = chunk.candidates[0].groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Fonte Detectada",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        // Regex mais robusta para pegar links mesmo com variações de texto ao redor
        const match = line.match(/(?:https:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9_-]{15,})/i);
        
        if (match) {
          const url = match[0].startsWith('http') ? match[0].trim() : `https://${match[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/NOME:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const catMatch = line.match(/CAT:\s*(.*)/i);

            onUpdate({
              group: {
                id: `wh-${Math.random().toString(36).substring(2, 9)}`,
                name: (nameMatch ? nameMatch[1] : "Novo Grupo Detectado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Grupo localizado pelo radar To-Ligado.com em tempo real.").trim(),
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
    onUpdate({ error: "Ocorreu um erro no radar de busca. Verifique sua conexão.", done: true });
  }
};
