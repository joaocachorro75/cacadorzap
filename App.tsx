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
    setHasSearched(true);
    
    document.body.classList.add('scanning');
    setStats(prev => ({ ...prev, totalSearches: prev.totalSearches + 1 }));

    try {
      await huntGroupsStream(keyword, (update: StreamUpdate) => {
        if (update.error) {
          setError(update.error);
          setIsLoading(false);
          document.body.classList.remove('scanning');
        }
        
        if (update.sources) {
          setSources(prev => {
            const existing = new Set(prev.map(p => p.uri));
            const unique = update.sources!.filter(s => !existing.has(s.uri));
            return [...prev, ...unique];
          });
        }
        
        if (update.group) {
          setResults(prev => [...prev, update.group as WhatsAppGroup]);
          setStats(s => ({ ...s, groupsFound: s.groupsFound + 1 }));
        }
        
        if (update.done) {
          setIsLoading(false);
          document.body.classList.remove('scanning');
        }
      });
    } catch (err: any) {
      setError(`ERRO DE CONEXÃO: ${err.message || "Falha ao estabelecer túnel de busca."}`);
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/20">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-8 px-6 py-4 glass rounded-3xl border-green-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono-tech italic">Fontes Interceptadas ({sources.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 15).map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] bg-black/40 border border-white/5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-green-400 hover:border-green-500/40 transition-all truncate max-w-[150px]">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 glass border-red-500/30 rounded-3xl text-red-400 mb-12 flex flex-col items-start gap-4 animate-slide-up">
                <div className="flex items-center gap-4">
                  <i className="fas fa-exclamation-triangle text-2xl"></i>
                  <h3 className="font-black uppercase tracking-widest text-sm">Status da Interceptação: Falha</h3>
                </div>
                <p className="text-xs font-mono bg-black/30 p-4 rounded-xl border border-red-500/10 w-full">
                  {error}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Dica: Verifique se sua API KEY tem saldo e se o recurso "Google Search" está habilitado no Google AI Studio.
                </p>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 px-6">
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col items-center">
                      <span className="text-7xl font-black text-white italic tracking-tighter text-gradient leading-none">
                        {results.length}
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em] mt-2 font-mono-tech">Alvos</span>
                    </div>
                    <div className="h-16 w-[1px] bg-white/10 hidden md:block"></div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                        Extração <br/> <span className="text-green-500">Massiva V15.5</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-4 bg-green-500/5 border border-green-500/10 px-8 py-4 rounded-3xl">
                      <i className="fas fa-circle-notch fa-spin text-green-500"></i>
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Rastreando Sinais...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-16 py-32 glass rounded-[4rem] text-center relative overflow-hidden group">
                <div className="relative z-10 px-8">
                  <i className="fas fa-satellite-dish text-5xl text-green-500 mb-8 animate-pulse"></i>
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-6 italic uppercase tracking-tighter">
                    Pronto para <span className="text-gradient">Interceptar</span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto mb-12 font-medium text-lg leading-relaxed">
                    Insira uma palavra-chave acima para iniciar a varredura neural em busca de grupos públicos e conexões ativas.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : view === 'admin-login' ? (
          <LoginForm 
            onLogin={() => { 
              localStorage.setItem('is_admin', 'true'); 
              window.location.hash = '#dashboard'; 
            }} 
            onCancel={() => window.location.hash = ''} 
          />
        ) : (
          <AdminPanel 
            stats={stats} 
            onLogout={() => { 
              localStorage.removeItem('is_admin'); 
              window.location.hash = ''; 
            }} 
            systemReady={true} 
          />
        )}
      </div>

      <footer className="py-16 border-t border-white/5 text-center mt-auto bg-black/40 backdrop-blur-xl">
        <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.8em] italic">Intelligence Systems | To-Ligado.com</p>
      </footer>
    </div>
  );
};

export default App;