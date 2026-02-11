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
    onUpdate({ error: "ERRO DE AUTENTICAÇÃO: Credenciais de busca não configuradas no sistema.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[PROTOCOLO DE EXTRAÇÃO RADAR TO-LIGADO V7.5]
ESTADO: OPERAÇÃO DE BUSCA PROFUNDA ATIVA.
ALVO: Links de convite de grupos de WhatsApp para o nicho específico: "${keyword}".

ESTRATÉGIA DE MINERAÇÃO:
1. DIRETÓRIOS E AGREGADORES: Pesquise em sites especializados como whatsappgrupos.com, gruposwhats.app, linkdogrupo.com e agregadores de links.
2. COMUNIDADES E FÓRUNS: Busque em threads do Reddit (r/WhatsAppGroups), Discord e fóruns de discussão.
3. REDES SOCIAIS: Verifique posts públicos no X (Twitter), Facebook e Instagram que contenham convites diretos.
4. PADRÃO TÉCNICO: Capture apenas URLs que correspondam ao padrão chat.whatsapp.com/[InviteCode].

REQUISITOS DE SAÍDA (FORMATO RÍGIDO - UMA LINHA POR REGISTRO):
ENTRY:[Nome Real do Grupo] | URL:[chat.whatsapp.com/ID] | INFO:[Propósito do grupo em 10 palavras] | TAG:[Categoria Principal]

LIMITAÇÕES OPERACIONAIS:
- NÃO invente nomes ou descrições.
- NÃO inclua conteúdo impróprio ou perigoso.
- Se nenhuma comunidade for detectada, retorne estritamente: "SIGNAL_LOST_404".`;

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
      // Captura de metadados de grounding para exibir as fontes reais da web
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

      if (fullText.includes("SIGNAL_LOST_404")) {
        onUpdate({ error: "Sinal Interrompido: Nenhuma comunidade verificada foi interceptada para este critério nos satélites públicos.", done: true });
        return;
      }

      const lines = fullText.split('\n');
      fullText = lines.pop() || "";

      for (const line of lines) {
        const urlMatch = line.match(/chat\.whatsapp\.com\/[a-zA-Z0-9_-]{12,}/i);
        
        if (urlMatch) {
          const url = `https://${urlMatch[0].trim()}`;
          if (!processedLinks.has(url)) {
            processedLinks.add(url);
            
            const nameMatch = line.match(/ENTRY:\s*(.*?)\s*\|/i);
            const infoMatch = line.match(/INFO:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/TAG:\s*(.*)/i);

            onUpdate({
              group: {
                id: `radar-ext-${Math.random().toString(36).substring(2, 10)}`,
                name: (nameMatch ? nameMatch[1] : "Grupo Localizado").trim(),
                url,
                description: (infoMatch ? infoMatch[1] : "Descrição interceptada via motor de inteligência To-Ligado.").trim(),
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
      error: "INSTABILIDADE NO NÚCLEO: O motor de busca profunda encontrou uma barreira de conexão. Tente novamente em instantes.", 
      done: true 
    });
  }
};