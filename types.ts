
export interface WhatsAppGroup {
  id: string;
  name: string;
  url: string;
  description: string;
  status: 'active' | 'verifying' | 'unknown';
  source?: string;
  category: string;
  relevanceScore: number;
  verifiedAt?: number;
}

export interface SearchResult {
  groups: WhatsAppGroup[];
  sources: Array<{ title: string; uri: string }>;
}

export interface AppStats {
  totalSearches: number;
  groupsFound: number;
  estimatedCost: number;
}
