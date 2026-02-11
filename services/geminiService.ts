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
    onUpdate({ error: "SISTEMA BLOQUEADO: Credenciais de acesso To-Ligado não detectadas. Verifique a configuração do servidor.", done: true });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `[PROTOCOLO DE EXTRAÇÃO RADAR V11.0]
STATUS: OPERAÇÃO DE BUSCA PROFUNDA ATIVA.
ALVO: Links de convite de grupos de WhatsApp (chat.whatsapp.com) para o nicho: "${keyword}".

ESTRATÉGIA DE VARREDURA:
1. DIRETÓRIOS E AGREGADORES: Priorize whatsappgrupos.com, gruposwhats.app e linkdogrupo.com.
2. INDEXAÇÃO DE REDES: Localize convites em posts recentes do X (Twitter), Reddit (r/WhatsAppGroups) e fóruns de nicho.
3. FILTRAGEM DE ELITE: Verifique a relevância e frescor dos dados. Capture apenas links operacionais.

REQUISITOS DE SAÍDA (FORMATO RÍGIDO - UMA LINHA POR REGISTRO):
ENTRY:[Nome do Grupo] | LINK:[URL] | DESC:[Resumo de 12 palavras] | TAG:[Nicho]

LIMITAÇÕES OPERACIONAIS:
- NÃO inclua conversas ou textos introdutórios.
- NÃO repita links capturados.
- Se nenhuma comunidade válida for detectada após varredura total, retorne: "SIGNAL_LOST_TOTAL".`;

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
        onUpdate({ error: "Sinal Interrompido: Nenhuma comunidade verificada foi localizada nos diretórios públicos para este critério.", done: true });
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
      error: "ANOMALIA NO NÚCLEO: Ocorreu uma interrupção na comunicação com a rede de busca. Tente restabelecer o radar.", 
      done: true 
    });
  }
};