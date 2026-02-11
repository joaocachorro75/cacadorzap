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
  
  const prompt = `VOCÊ É O "RADAR TO-LIGADO", O SISTEMA DE BUSCA DE ELITE DO PORTAL TO-LIGADO.COM.
  
  SUA MISSÃO: Realizar uma varredura profunda e exaustiva na web para encontrar o MAIOR NÚMERO POSSÍVEL de links de convite ativos para grupos de WhatsApp sobre: "${keyword}".
  
  PROTOCOLO DE BUSCA:
  1. Utilize o Google Search para indexar diretórios, fóruns (Reddit, Quora), redes sociais (X, Facebook Groups, Bio de Instagram) e listas de transmissão públicas.
  2. Priorize links no formato: chat.whatsapp.com/INVITE_CODE.
  3. Explore resultados de 2024 e 2025 para garantir links que ainda não foram revogados.
  4. Seja persistente: extraia o máximo de links únicos que encontrar.
  
  FORMATO ESTRUTURADO DE RESPOSTA (UMA LINHA POR GRUPO):
  NOME: [Título Curto] | LINK: [URL chat.whatsapp.com/...] | DESC: [Resumo do propósito] | CAT: [Categoria: Vendas, Hobby, Tech, etc]
  
  RESTRIÇÃO: Não escreva introduções, comentários ou conclusões. Apenas as linhas de dados. Se não encontrar nada, informe que a varredura não detectou sinais.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.15,
        topP: 0.95
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Extração de Grounding (Fontes da Web)
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

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        // Regex robusta para capturar o código do convite e o link
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
                name: (nameMatch ? nameMatch[1] : "Grupo Localizado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Link interceptado pelo Radar To-Ligado.").trim(),
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
    console.error("Erro Crítico no Radar:", error);
    let errorMsg = "O radar detectou uma interferência atmosférica (erro de conexão).";
    if (error?.message?.includes("API_KEY")) errorMsg = "A autenticação do radar falhou (API_KEY ausente ou inválida).";
    onUpdate({ error: errorMsg, done: true });
  }
};