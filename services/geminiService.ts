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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO", UM SISTEMA DE BUSCA DE ELITE ESPECIALIZADO EM INDEXAÇÃO DE COMUNIDADES DIGITAIS.
  
  MISSÃO ATUAL: Localizar o MAIOR NÚMERO POSSÍVEL de links de convite ativos para grupos de WhatsApp relacionados a: "${keyword}".
  
  INSTRUÇÕES OPERACIONAIS:
  1. Varra agressivamente diretórios públicos, redes sociais (X, Facebook, Instagram), fóruns (Reddit, Quora) e índices de grupos de 2024 e 2025.
  2. Identifique links no formato exato: chat.whatsapp.com/INVITE_CODE.
  3. Seja EXAUSTIVO e persistente. Não se limite aos primeiros resultados; explore profundamente os resultados de busca.
  4. Extraia apenas links de GRUPOS (não aceite links wa.me de contatos individuais).
  
  FORMATO DE SAÍDA (ESTRITAMENTE UMA LINHA POR GRUPO):
  NOME: [Nome do Grupo] | LINK: [URL Completa] | DESC: [O que é o grupo] | CAT: [Categoria do Grupo]
  
  Não inclua saudações ou explicações. Apenas os dados estruturados conforme solicitado. Comece agora.`;

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
            title: c.web.title || "Fonte de Dados",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        const match = line.match(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9_-]{15,})/i);
        
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
                name: (nameMatch ? nameMatch[1] : "Grupo Encontrado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Indexado pelo Radar To-Ligado.").trim(),
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
    console.error("Erro no huntGroupsStream:", error);
    const errorMessage = error?.message?.includes("API_KEY") 
      ? "Chave de API inválida ou não configurada." 
      : "O radar encontrou uma zona de sombra. Tente novamente mais tarde.";
    onUpdate({ error: errorMessage, done: true });
  }
};