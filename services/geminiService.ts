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
  
  const prompt = `ATUAR COMO O "RADAR TO-LIGADO" (SISTEMA DE MINERAÇÃO DE DADOS DE ALTA PRECISÃO).

MISSÃO: Localizar e extrair TODOS os links de convite ativos para grupos de WhatsApp sobre "${keyword}".

PROTOCOLOS DE BUSCA:
1. PESQUISA EXAUSTIVA: Utilize o Google Search para varrer diretórios de grupos, comunidades em redes sociais (Twitter/X, Facebook, Bio de Instagram), fóruns de nicho (Reddit, Quora) e agregadores de links.
2. FOCO EM ATIVIDADE: Dê prioridade a links postados ou atualizados entre 2024 e 2026.
3. FILTRAGEM DE ELITE: Apenas links no formato 'chat.whatsapp.com/INVITE_CODE'. Ignore links de contatos individuais (wa.me).
4. RECURSIVIDADE: Se encontrar um diretório, explore os links internos para maximizar o volume de resultados.

FORMATO DE RESPOSTA (ESTRITAMENTE UMA LINHA POR RESULTADO):
NOME: [Nome do Grupo] | LINK: [URL Completa] | DESC: [Resumo objetivo do grupo] | CAT: [Categoria exata]

REGRAS CRÍTICAS:
- Proibido introduções, feedbacks ou conclusões.
- Saída apenas em formato de lista de dados.
- Se a varredura for negativa, responda: "STATUS: SINAL NÃO DETECTADO".`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        topP: 0.9,
      },
    });

    let fullText = "";
    const processedLinks = new Set<string>();

    for await (const chunk of responseStream) {
      // Processamento de GroundingMetadata para exibir fontes reais
      const candidates = chunk.candidates?.[0];
      if (candidates?.groundingMetadata?.groundingChunks) {
        const sources = candidates.groundingMetadata.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Portal de Indexação",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        if (line.includes("STATUS: SINAL NÃO DETECTADO")) {
            onUpdate({ error: "Nenhum sinal detectado para esta palavra-chave nos satélites atuais.", done: true });
            return;
        }

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
                name: (nameMatch ? nameMatch[1] : "Grupo Identificado").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Capturado pelo fluxo de dados To-Ligado.").trim(),
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
    console.error("Falha na Operação Radar:", error);
    let message = "Falha na conexão com os servidores de inteligência To-Ligado.";
    if (error?.message?.includes("API_KEY")) message = "Erro de Autenticação: Chave de API expirada ou inválida.";
    onUpdate({ error: message, done: true });
  }
};