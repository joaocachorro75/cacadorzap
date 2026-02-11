import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import GroupCard from './components/GroupCard';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import { huntGroupsStream, StreamUpdate } from './services/geminiService';
import { WhatsAppGroup, AppStats } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'admin-login' | 'admin-panel'>('public');
  const [results, setResults] = useState<WhatsAppGroup[]>([]);
  const [sources, setSources] = useState<Array<{title: string, uri: string}>>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [stats, setStats] = useState<AppStats>({
    totalSearches: 0,
    groupsFound: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') setView('admin-login');
      else if (hash === '#dashboard' && localStorage.getItem('is_admin') === 'true') setView('admin-panel');
      else setView('public');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSearch = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSources([]);
    setVerifiedCount(0);
    setHasSearched(true);

    try {
      await huntGroupsStream(keyword, (update: StreamUpdate) => {
        if (update.error) setError(update.error);
        if (update.sources) {
          setSources(prev => {
            const existing = new Set(prev.map(p => p.uri));
            const newOnes = update.sources!.filter(s => !existing.has(s.uri));
            return [...prev, ...newOnes];
          });
        }
        if (update.group) {
          setResults(prev => [...prev, update.group as WhatsAppGroup]);
          setStats(s => ({ ...s, groupsFound: s.groupsFound + 1 }));
        }
        if (update.done) setIsLoading(false);
      });
    } catch (err) {
      setError("Falha crítica no Radar To-Ligado.");
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/30">
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-8 px-4 py-3 glass rounded-2xl flex flex-wrap gap-3 items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fontes de Pesquisa:</span>
                {sources.slice(0, 5).map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-green-400 hover:underline flex items-center gap-1">
                    <i className="fas fa-link text-[8px]"></i> {s.title.substring(0, 20)}...
                  </a>
                ))}
              </div>
            )}

            {error && (
              <div className="p-4 glass border-red-500/30 rounded-2xl text-red-400 mb-8 text-xs font-bold uppercase">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section>
                <div className="flex justify-between items-end mb-8 px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black text-white italic">{results.length}</span>
                    <h2 className="text-lg font-bold text-slate-300 uppercase">Grupos Encontrados</h2>
                  </div>
                  {isLoading && <div className="text-green-500 text-[10px] font-black uppercase animate-pulse">Varrendo Redes...</div>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} onVerified={(id, v) => v && setVerifiedCount(c => c+1)} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-20 py-24 glass rounded-[3rem] text-center">
                <h2 className="text-5xl font-black text-white mb-4 italic uppercase">Radar <span className="text-gradient">To-Ligado</span></h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-8 font-medium">Digite uma palavra-chave para que nossa IA localize grupos exclusivos e ativos em tempo real.</p>
                <div className="flex justify-center gap-8 opacity-40">
                  <div className="text-center"><div className="text-xl font-bold text-white">2025</div><div className="text-[8px] uppercase font-black">Scan</div></div>
                  <div className="text-center"><div className="text-xl font-bold text-white">100%</div><div className="text-[8px] uppercase font-black">Online</div></div>
                </div>
              </div>
            )}
          </div>
        ) : view === 'admin-login' ? (
          <LoginForm onLogin={() => { localStorage.setItem('is_admin', 'true'); window.location.hash = '#dashboard'; }} onCancel={() => window.location.hash = ''} />
        ) : (
          <AdminPanel stats={stats} onLogout={() => { localStorage.removeItem('is_admin'); window.location.hash = ''; }} systemReady={true} />
        )}
      </div>
      <footer className="py-8 border-t border-white/5 text-center mt-auto">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">To-Ligado.com © 2025 - Tecnologia de Busca Inteligente</p>
      </footer>
    </div>
  );
};

export default App;