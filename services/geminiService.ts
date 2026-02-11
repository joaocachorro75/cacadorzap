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
  // Inicialização segura - Garante que o processo não quebre se process.env não estiver totalmente mapeado
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });
  
  const prompt = `ACT AS "RADAR TO-LIGADO" DEEP CRAWLER.
TARGET: WhatsApp Group Invite Links for "${keyword}".

SCAN PROTOCOL:
1. Search across group directories, social media profiles (X, FB, IG), and forum threads (Reddit/Quora).
2. ONLY capture links starting with 'chat.whatsapp.com/'.
3. MANDATORY: Find the most recent links from 2024 to 2025.
4. Output format MUST be one line per group:
NOME: [Name] | LINK: [URL] | DESC: [Short Purpose] | CAT: [Category]

CRITICAL: NO CONVERSATION. NO INTROS. ONLY DATA.
If no links found, output: "SIGNAL_NOT_FOUND".`;

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
      // Grounding / Fontes
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Indexador Web",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_NOT_FOUND")) {
        onUpdate({ error: "O radar não detectou sinais ativos para este termo.", done: true });
        return;
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        const match = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{15,}/i);
        
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
                description: (descMatch ? descMatch[1] : "Capturado via mineração To-Ligado.").trim(),
                category: (catMatch ? catMatch[1] : "Comunidade").trim(),
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
    console.error("Radar Error:", error);
    onUpdate({ 
      error: "Falha na conexão com o Radar To-Ligado. Verifique sua chave de acesso.", 
      done: true 
    });
  }
};