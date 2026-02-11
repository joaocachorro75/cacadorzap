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
    } catch (err) {
      setError("FALHA DE COMUNICAÇÃO: O sinal foi perdido durante a interceptação.");
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
                  {sources.slice(0, 20).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[9px] bg-black/40 border border-white/5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-green-400 hover:border-green-500/40 transition-all truncate max-w-[180px]"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-10 glass border-red-500/30 rounded-[3rem] text-red-400 mb-12 flex flex-col md:flex-row items-center gap-8 animate-shake">
                <i className="fas fa-radiation text-4xl animate-pulse"></i>
                <p className="text-lg font-black uppercase tracking-tight">{error}</p>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="ml-auto px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] border border-white/10 transition-all"
                >
                  Resetar Radar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 px-6">
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col items-center">
                      <span className="text-7xl md:text-9xl font-black text-white italic tracking-tighter leading-none text-gradient">
                        {results.length}
                      </span>
                      <span className="text-[12px] font-black text-green-500 uppercase tracking-[0.8em] mt-4 font-mono-tech">Alvos</span>
                    </div>
                    <div className="h-24 w-[1px] bg-white/10 hidden md:block"></div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-tight">
                        Extração <br/> <span className="text-green-500">Massiva V15</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-6 bg-green-500/5 border border-green-500/10 px-10 py-5 rounded-[2.5rem]">
                      <div className="flex gap-2">
                        <div className="w-2 h-8 bg-green-500 animate-bounce"></div>
                        <div className="w-2 h-8 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-8 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[12px] font-black uppercase tracking-[0.6em] animate-pulse">Interceptando Sinais...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-40">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-16 py-40 md:py-60 glass rounded-[6rem] text-center relative overflow-hidden group border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-12">
                  <div className="w-40 h-40 bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto mb-16 border border-slate-800 shadow-2xl group-hover:rotate-[15deg] transition-all duration-700">
                    <i className="fas fa-radar text-6xl text-green-500 animate-pulse"></i>
                  </div>
                  <h2 className="text-6xl md:text-[10rem] font-black text-white mb-12 italic uppercase tracking-tighter leading-none">
                    Massive <span className="text-gradient">V15</span>
                  </h2>
                  <p className="text-slate-400 max-w-4xl mx-auto mb-20 font-medium text-xl md:text-3xl leading-relaxed opacity-80 italic px-6">
                    O caçador definitivo de links públicos. Intercepte conexões ativas em segundos com o motor de busca neural da To-Ligado.
                  </p>
                  <div className="flex justify-center gap-16 md:gap-32 opacity-40">
                    <div className="text-center">
                      <div className="text-5xl font-black text-white font-mono-tech">100%</div>
                      <div className="text-[11px] uppercase font-black tracking-widest text-green-500 mt-2">Deep Search</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-white font-mono-tech">∞</div>
                      <div className="text-[11px] uppercase font-black tracking-widest text-green-500 mt-2">Max Capacity</div>
                    </div>
                  </div>
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

      <footer className="py-24 border-t border-white/5 text-center mt-auto bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-10">
            <div className="w-20 h-[1px] bg-green-500/30 mx-auto mb-10"></div>
            <p className="text-[13px] text-slate-500 font-black uppercase tracking-[1.2em] mb-10 italic">Intelligence Systems | To-Ligado.com</p>
            <p className="text-[11px] text-slate-700 font-bold max-w-4xl mx-auto leading-relaxed uppercase tracking-[0.3em] italic">
              Operacional v15.0 - Todos os direitos reservados. O acesso a grupos de terceiros é de responsabilidade única do usuário final.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;