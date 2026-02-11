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
    onUpdate({ error: "SISTEMA BLOQUEADO: Credenciais de autenticação To-Ligado não detectadas no ambiente.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[RADAR TO-LIGADO INTELLIGENCE V8.5]
ESTADO: OPERAÇÃO DE BUSCA PROFUNDA ATIVA.
ALVO: Interceptar convites ATIVOS e VERIFICÁVEIS de grupos do WhatsApp focados em: "${keyword}".

ESTRATÉGIA DE VARREDURA:
1. DIRETÓRIOS WEB: Varra intensivamente whatsappgrupos.com, linkdogrupo.com, gruposwhats.app e diretórios regionais.
2. FONTES SOCIAIS: Identifique links compartilhados recentemente em perfis públicos do Instagram, threads do Reddit e posts do X (Twitter).
3. VALIDAÇÃO TÉCNICA: Capture apenas links que correspondam estritamente ao padrão: chat.whatsapp.com/[InviteID].
4. EXTRAÇÃO DE CONTEXTO: Determine o nome real, a categoria de nicho e uma descrição tática do grupo.

FORMATO DE RESPOSTA (ESTRITAMENTE UMA LINHA POR REGISTRO):
DATA:[Nome do Grupo] | LINK:[URL] | DESC:[Breve resumo do propósito] | TAG:[Categoria]

REGRAS DE EXECUÇÃO:
- NÃO inclua conversas, explicações ou notas de rodapé.
- NÃO repita links captados em varreduras anteriores.
- Se nenhuma comunidade de alta relevância for detectada, retorne: SIGNAL_LOSS_TOTAL.`;

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
            title: c.web.title || "Fonte Interceptada",
            uri: c.web.uri
          }));
        if (sources.length > 0) onUpdate({ sources });
      }

      const chunkText = chunk.text || "";
      fullText += chunkText;

      if (fullText.includes("SIGNAL_LOSS_TOTAL")) {
        onUpdate({ error: "Sinal Fraco: O radar não conseguiu decodificar comunidades ativas para este termo nos satélites públicos agora.", done: true });
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
            
            const nameMatch = line.match(/DATA:\s*(.*?)\s*\|/i);
            const descMatch = line.match(/DESC:\s*(.*?)\s*\|/i);
            const tagMatch = line.match(/TAG:\s*(.*)/i);

            onUpdate({
              group: {
                id: `track-v85-${Math.random().toString(36).substring(2, 11)}`,
                name: (nameMatch ? nameMatch[1] : "Comunidade Identificada").trim(),
                url,
                description: (descMatch ? descMatch[1] : "Descrição extraída via processamento de linguagem natural To-Ligado.").trim(),
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
      error: "ANOMALIA NO NÚCLEO: Houve uma interrupção na comunicação com o motor de busca profunda. Tente novamente em alguns segundos.", 
      done: true 
    });
  }
};